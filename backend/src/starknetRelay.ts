import { Router, Request, Response } from "express";
import {
  Account,
  RpcProvider,
  defaultDeployer,
  num as starknetNum,
  type Call,
} from "starknet";
import {
  getCircuitHash,
  getCircuitHashByHash,
  saveCircuitDeployment,
  saveCircuitHash,
} from "./db/circuitHashes.js";
import {
  getVerifyCalldata as xerostarkGetVerifyCalldata,
  registerDeployment,
  registerProof,
} from "./xerostark.js";

const router = Router();

type ExecuteResult = {
  transaction_hash: string | bigint;
};

type RelayCall = Call & {
  calldata?: Array<string | number | bigint>;
};

function getRelayConfig() {
  const nodeUrl = process.env.STARKNET_RPC_URL;
  const address =
    process.env.STARKNET_RELAYER_ADDRESS;
  const privateKey =
    process.env.STARKNET_RELAYER_PRIVATE_KEY;

  return {
    configured: !!(nodeUrl && address && privateKey),
    nodeUrl,
    address,
    privateKey,
  };
}

function getRelayAccount() {
  const config = getRelayConfig();

  if (!config.configured || !config.nodeUrl || !config.address || !config.privateKey) {
    throw new Error(
      "Starknet relayer is not configured. Set STARKNET_RPC_URL, STARKNET_RELAYER_ADDRESS, and STARKNET_RELAYER_PRIVATE_KEY in backend/.env.",
    );
  }

  const provider = new RpcProvider({ nodeUrl: config.nodeUrl });
  return new Account({
    provider,
    address: config.address,
    signer: config.privateKey,
  });
}

function normalizeTxHash(value: string | bigint) {
  return typeof value === "string" ? value : `0x${value.toString(16)}`;
}

function normalizeCalldata(values: Array<string | number | bigint>) {
  return values.map((value) => starknetNum.toHex(value));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function ensureXeroStarkDeploymentRegistered(params: {
  circuitHash: string;
  classHash: string;
  contractAddress: string;
  deployTxHash?: string;
  deployedBy?: string;
}) {
  await registerDeployment({
    circuit_hash: params.circuitHash,
    class_hash: params.classHash,
    contract_address: params.contractAddress,
    tx_hash: params.deployTxHash || "",
    deployed_by: params.deployedBy,
  });
}

async function deployVerifierWithRelay(
  account: Account,
  credentialType: string,
  circuitHash: string,
  classHash: string,
) {
  const { calls: rawCalls, addresses } = defaultDeployer.buildDeployerCall(
    { classHash, constructorCalldata: [] },
    account.address,
  );

  const contractAddress = addresses[0];
  const calls: Call[] = (rawCalls as RelayCall[]).map((call) => ({
    ...call,
    calldata: normalizeCalldata(call.calldata ?? []),
  }));

  const tx = (await account.execute(calls, { tip: 0 })) as ExecuteResult;
  const deployTxHash = normalizeTxHash(tx.transaction_hash);

  await account.waitForTransaction(deployTxHash);

  saveCircuitDeployment(credentialType, contractAddress, deployTxHash);

  await registerDeployment({
    circuit_hash: circuitHash,
    class_hash: classHash,
    contract_address: contractAddress,
    tx_hash: deployTxHash,
    deployed_by: account.address,
  });

  return {
    contractAddress,
    deployTxHash,
  };
}

router.get("/status", (_req: Request, res: Response) => {
  const config = getRelayConfig();
  res.json({
    configured: config.configured,
    relayer_address: config.address || null,
  });
});

router.post("/verify", async (req: Request, res: Response) => {
  const {
    credential_type,
    circuit_hash,
    class_hash,
    contract_address,
    proof,
    public_signals,
  } = req.body as {
    credential_type?: string;
    circuit_hash?: string;
    class_hash?: string;
    contract_address?: string;
    proof?: string;
    public_signals?: string[] | string;
  };

  if (!circuit_hash || !proof || !public_signals) {
    res.status(400).json({
      error: "Missing circuit_hash, proof, or public_signals",
    });
    return;
  }

  try {
    const account = getRelayAccount();
    const publicSignalsValue = Array.isArray(public_signals)
      ? JSON.stringify(public_signals)
      : public_signals;

    const cachedByType = credential_type ? getCircuitHash(credential_type) : null;
    const cachedByHash = getCircuitHashByHash(circuit_hash);
    const cached = cachedByType ?? cachedByHash;
    const resolvedCredentialType =
      credential_type ?? cachedByHash?.credential_type ?? "custom";
    const resolvedClassHash = class_hash ?? cached?.class_hash ?? undefined;

    if (resolvedCredentialType !== "custom") {
      saveCircuitHash(resolvedCredentialType, circuit_hash, resolvedClassHash);
    }

    let contractAddress = contract_address ?? cached?.deployed_address ?? null;
    let deployTxHash: string | undefined;

    if (!contractAddress) {
      if (!resolvedClassHash) {
        res.status(400).json({
          error:
            "No deployed verifier is cached for this circuit, and no class_hash was provided for a fresh deployment.",
        });
        return;
      }

      const deployment = await deployVerifierWithRelay(
        account,
        resolvedCredentialType,
        circuit_hash,
        resolvedClassHash,
      );

      contractAddress = deployment.contractAddress;
      deployTxHash = deployment.deployTxHash;
    }

    let calldataResult;

    try {
      calldataResult = await xerostarkGetVerifyCalldata({
        circuit_hash,
        proof,
        public_signals: publicSignalsValue,
        created_by: account.address,
      });
    } catch (error) {
      const message = getErrorMessage(error);
      const shouldRepairDeployment =
        message.includes("No deployed verifier contract found for this circuit") &&
        !!contractAddress &&
        !!resolvedClassHash;

      if (!shouldRepairDeployment) {
        throw error;
      }

      await ensureXeroStarkDeploymentRegistered({
        circuitHash: circuit_hash,
        classHash: resolvedClassHash,
        contractAddress,
        deployTxHash: deployTxHash ?? cached?.deploy_tx_hash ?? undefined,
        deployedBy: account.address,
      });

      calldataResult = await xerostarkGetVerifyCalldata({
        circuit_hash,
        proof,
        public_signals: publicSignalsValue,
        created_by: account.address,
      });
    }

    const calldata = Array.isArray(calldataResult.calldata)
      ? (calldataResult.calldata as string[])
      : [];

    if (!calldata.length) {
      throw new Error("XeroStark did not return verification calldata.");
    }

    const tx = (await account.execute([
      {
        contractAddress,
        entrypoint: "verify_groth16_proof_bn254",
        calldata: normalizeCalldata(calldata),
      },
    ], { tip: 0 })) as ExecuteResult;

    const txHash = normalizeTxHash(tx.transaction_hash);

    await registerProof({
      circuit_hash,
      proof,
      public_signals: publicSignalsValue,
      tx_hash: txHash,
      created_by: account.address,
    });

    res.json({
      success: true,
      tx_hash: txHash,
      contract_address: contractAddress,
      deploy_tx_hash: deployTxHash,
      relayer_address: account.address,
    });
  } catch (error) {
    console.error("[StarknetRelay] Verification failed:", error);

    const rawMessage = getErrorMessage(error);
    const message =
      rawMessage
        ? rawMessage.includes("tip statistics") ||
          rawMessage.includes("starting block number")
          ? "Starknet RPC could not estimate transaction tip data. Try a different STARKNET_RPC_URL in backend/.env or retry later."
          : rawMessage
        : "Starknet verification via backend relayer failed";

    res.status(500).json({
      error: message,
    });
  }
});

export default router;
