import { Router, Request, Response } from "express";
import { getCircuitHash, saveCircuitHash, getAllCircuitHashes } from "./db/circuitHashes.js";

const router = Router();

router.get("/", (_req: Request, res: Response) => {
  try {
    const hashes = getAllCircuitHashes();
    res.json({ hashes });
  } catch (error) {
    console.error("[CircuitHashes] Failed to fetch:", error);
    res.status(500).json({ error: "Failed to fetch circuit hashes" });
  }
});

router.get("/:type", (req: Request, res: Response) => {
  const credentialType = req.params.type as string;

  try {
    const row = getCircuitHash(credentialType);
    if (!row) {
      res.status(404).json({ error: "No cached circuit hash for this type" });
      return;
    }
    res.json({
      credential_type: credentialType,
      circuit_hash: row.circuit_hash,
      class_hash: row.class_hash ?? undefined,
      deployed_address: row.deployed_address ?? undefined,
      deploy_tx_hash: row.deploy_tx_hash ?? undefined,
      deployed_at: row.deployed_at ?? undefined,
    });
  } catch (error) {
    console.error("[CircuitHashes] Failed to fetch:", error);
    res.status(500).json({ error: "Failed to fetch circuit hash" });
  }
});

router.post("/", (req: Request, res: Response) => {
  const { credential_type, circuit_hash, class_hash } = req.body;

  if (!credential_type || !circuit_hash) {
    res
      .status(400)
      .json({ error: "Missing credential_type or circuit_hash" });
    return;
  }

  try {
    saveCircuitHash(credential_type, circuit_hash, class_hash);
    console.log(
      `[CircuitHashes] Cached hash for ${credential_type}: ${circuit_hash.slice(0, 16)}...${class_hash ? ` (class: ${class_hash.slice(0, 16)}...)` : ''}`
    );
    res.json({ success: true });
  } catch (error) {
    console.error("[CircuitHashes] Failed to save:", error);
    res.status(500).json({ error: "Failed to cache circuit hash" });
  }
});

export default router;
