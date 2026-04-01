import { Router, Request, Response } from "express";
import * as Client from "@storacha/client";
import { StoreMemory } from "@storacha/client/stores/memory";
import * as Proof from "@storacha/client/proof";
import { Signer } from "@storacha/client/principal/ed25519";
import { createHash, createHmac } from "node:crypto";
import { CID } from "multiformats/cid";
import * as bitcoinMessage from "bitcoinjs-message";
import {
  findStorachaAppFile,
  listStorachaAppFiles,
  markStorachaAppFileDeleted,
  saveStorachaAppFile,
} from "./db/storachaFiles.js";

const router = Router();

// Cache the server-side Storacha client
let _serverClient: Client.Client | null = null;

type AppOwnedAction = "upload" | "list" | "remove";

async function getServerClient(): Promise<Client.Client> {
  if (_serverClient) return _serverClient;

  const key = process.env.STORACHA_KEY;
  const proof = process.env.STORACHA_PROOF;

  if (!key || !proof) {
    throw new Error(
      "Missing STORACHA_KEY or STORACHA_PROOF env vars. " +
        "Run `storacha key create` and `storacha delegation create <did> --base64` " +
        "to generate these values."
    );
  }

  const principal = Signer.parse(key);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });

  const delegation = await Proof.parse(proof);
  const space = await client.addSpace(delegation);
  await client.setCurrentSpace(space.did());

  _serverClient = client;
  console.log("[Storacha] Delegation server connected to space:", space.did());
  return client;
}

function getWalletHashSecret(): string {
  const secret = process.env.STORACHA_WALLET_HASH_SECRET;
  if (!secret) {
    throw new Error(
      "Missing STORACHA_WALLET_HASH_SECRET env var for app-owned Storacha indexing."
    );
  }

  return secret;
}

function hashWalletAddress(walletAddress: string): string {
  return createHmac("sha256", getWalletHashSecret())
    .update(walletAddress.trim())
    .digest("hex");
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function buildAppOwnedMessage(
  action: AppOwnedAction,
  walletAddress: string,
  timestamp: string,
  payloadHash: string,
  previousCid?: string,
): string {
  return [
    "zkly storacha authorization",
    "",
    `Action: ${action}`,
    `Wallet: ${walletAddress}`,
    `Timestamp: ${timestamp}`,
    `Payload: ${payloadHash}`,
    `Replace: ${previousCid || "-"}`,
  ].join("\n");
}

function verifyAppOwnedSignature(input: {
  action: AppOwnedAction;
  walletAddress: string;
  timestamp: string;
  signature: string;
  payloadHash: string;
  previousCid?: string;
}) {
  const { action, walletAddress, timestamp, signature, payloadHash, previousCid } = input;

  if (!walletAddress || !signature || !timestamp) {
    throw new Error("Missing wallet authorization fields.");
  }

  const timestampMs = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(timestampMs)) {
    throw new Error("Invalid Storacha request timestamp.");
  }

  const ageMs = Math.abs(Date.now() - timestampMs);
  if (ageMs > 5 * 60 * 1000) {
    throw new Error("Storacha request expired. Please sign again.");
  }

  const message = buildAppOwnedMessage(
    action,
    walletAddress,
    timestamp,
    payloadHash,
    previousCid,
  );
  const normalizedSignature = signature.trim();
  const isValid = bitcoinMessage.verify(
    message,
    walletAddress.trim(),
    normalizedSignature,
    undefined,
    true,
  );

  if (!isValid) {
    throw new Error("Wallet signature verification failed for app-owned Storacha access.");
  }
}

router.post("/app/upload", async (req: Request, res: Response) => {
  const {
    wallet_address: walletAddress,
    timestamp,
    signature,
    metadata_json: metadataJson,
    previous_cid: previousCid,
  } = req.body as {
    wallet_address?: string;
    timestamp?: string;
    signature?: string;
    metadata_json?: string;
    previous_cid?: string;
  };

  if (!walletAddress || !timestamp || !signature || !metadataJson) {
    res.status(400).json({ error: "Missing upload authorization or metadata payload." });
    return;
  }

  try {
    verifyAppOwnedSignature({
      action: "upload",
      walletAddress,
      timestamp,
      signature,
      payloadHash: sha256Hex(metadataJson),
      previousCid,
    });

    const metadata = JSON.parse(metadataJson) as { type?: string };
    const client = await getServerClient();
    const blob = new Blob([metadataJson], { type: "application/json" });
    const cid = (await client.uploadFile(blob)).toString();
    const walletHash = hashWalletAddress(walletAddress);

    saveStorachaAppFile(walletHash, cid, metadata.type);

    if (previousCid) {
      const existing = findStorachaAppFile(walletHash, previousCid);
      if (existing) {
        try {
          await client.remove(CID.parse(previousCid));
        } catch {
          // Best effort. The new CID is still the active pointer for this wallet.
        }
        markStorachaAppFileDeleted(walletHash, previousCid);
      }
    }

    res.json({ cid });
  } catch (error) {
    console.error("[Storacha] App-owned upload failed:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "App-owned upload failed",
    });
  }
});

router.post("/app/list", async (req: Request, res: Response) => {
  const {
    wallet_address: walletAddress,
    timestamp,
    signature,
  } = req.body as {
    wallet_address?: string;
    timestamp?: string;
    signature?: string;
  };

  if (!walletAddress || !timestamp || !signature) {
    res.status(400).json({ error: "Missing list authorization." });
    return;
  }

  try {
    verifyAppOwnedSignature({
      action: "list",
      walletAddress,
      timestamp,
      signature,
      payloadHash: "-",
    });

    const walletHash = hashWalletAddress(walletAddress);
    const files = listStorachaAppFiles(walletHash).map((row) => ({
      cid: row.cid,
      insertedAt: row.created_at,
      credentialType: row.credential_type,
    }));

    res.json({ files });
  } catch (error) {
    console.error("[Storacha] App-owned list failed:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "App-owned file listing failed",
    });
  }
});

router.post("/app/remove", async (req: Request, res: Response) => {
  const {
    wallet_address: walletAddress,
    timestamp,
    signature,
    cid,
  } = req.body as {
    wallet_address?: string;
    timestamp?: string;
    signature?: string;
    cid?: string;
  };

  if (!walletAddress || !timestamp || !signature || !cid) {
    res.status(400).json({ error: "Missing remove authorization." });
    return;
  }

  try {
    verifyAppOwnedSignature({
      action: "remove",
      walletAddress,
      timestamp,
      signature,
      payloadHash: sha256Hex(cid),
    });

    const walletHash = hashWalletAddress(walletAddress);
    const existing = findStorachaAppFile(walletHash, cid);
    if (!existing) {
      res.status(404).json({ error: "That file is not registered to this wallet." });
      return;
    }

    const client = await getServerClient();
    await client.remove(CID.parse(cid));
    markStorachaAppFileDeleted(walletHash, cid);

    res.json({ ok: true });
  } catch (error) {
    console.error("[Storacha] App-owned removal failed:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "App-owned file removal failed",
    });
  }
});

export default router;
