const API = import.meta.env.VITE_ZKLY_API_URL || 'http://localhost:3001';

export interface VerifyResult {
  txHash: string;
  contractAddress: string;
  deployTxHash?: string;
  relayerAddress?: string;
}

export interface RelayStatus {
  configured: boolean;
  relayer_address: string | null;
}

export async function getStarknetRelayStatus(): Promise<RelayStatus> {
  const response = await fetch(`${API}/api/starknet/status`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch Starknet relay status');
  }

  return data;
}

export async function verifyOnStarknet(
  credentialType: string,
  circuitHash: string,
  classHash: string | undefined,
  contractAddress: string | undefined,
  proof: string,
  publicSignals: string[],
): Promise<VerifyResult> {
  const response = await fetch(`${API}/api/starknet/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credential_type: credentialType,
      circuit_hash: circuitHash,
      class_hash: classHash,
      contract_address: contractAddress,
      proof,
      public_signals: publicSignals,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Starknet verification failed');
  }

  return {
    txHash: data.tx_hash,
    contractAddress: data.contract_address,
    deployTxHash: data.deploy_tx_hash || undefined,
    relayerAddress: data.relayer_address || undefined,
  };
}

const VOYAGER_BASE = 'https://sepolia.voyager.online';

export function getVoyagerTxUrl(txHash: string): string {
  return `${VOYAGER_BASE}/tx/${txHash}`;
}

export function getVoyagerContractUrl(contractAddress: string): string {
  return `${VOYAGER_BASE}/contract/${contractAddress}`;
}
