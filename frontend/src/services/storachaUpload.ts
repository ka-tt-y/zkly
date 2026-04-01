import type { SubjectDisplayMode } from '../utils/subjectIdentity';

const API = import.meta.env.VITE_ZKLY_API_URL || 'http://localhost:3001';

export const IPFS_GATEWAY = 'https://storacha.link/ipfs';

type WalletSigner = (message: string) => Promise<string>;

export type StorachaStorageMode = 'app-owned';

export interface CredentialMetadata {
  version: number;
  protocol: string;
  type: string;
  publicSignals: string[];
  circuitHash: string;
  identityCommitment: string;
  subjectCommitment?: string;
  subjectDisplay?: string;
  subjectDisplayMode?: SubjectDisplayMode;
  sourceApi?: string;
  snapshotTimestamp?: string;
  verificationNetwork?: string;
  starknetTxHash?: string;
  starknetContractAddress?: string;
  createdAt: string;
  expiresAt?: string | null;
}

export interface StorachaFileRecord {
  cid: string;
  insertedAt?: string;
  updatedAt?: string;
  credentialType?: string;
}

async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function buildAppOwnedMessage(
  action: 'upload' | 'list' | 'remove',
  walletAddress: string,
  timestamp: string,
  payloadHash: string,
  previousCid?: string,
) {
  return [
    'zkly storacha authorization',
    '',
    `Action: ${action}`,
    `Wallet: ${walletAddress}`,
    `Timestamp: ${timestamp}`,
    `Payload: ${payloadHash}`,
    `Replace: ${previousCid || '-'}`,
  ].join('\n');
}

async function signAppOwnedRequest(input: {
  action: 'upload' | 'list' | 'remove';
  walletAddress: string;
  signMessage: WalletSigner;
  payloadHash: string;
  previousCid?: string;
}) {
  const timestamp = Date.now().toString();
  const message = buildAppOwnedMessage(
    input.action,
    input.walletAddress,
    timestamp,
    input.payloadHash,
    input.previousCid,
  );
  const signature = await input.signMessage(message);

  return { timestamp, signature };
}

async function appOwnedRequest<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API}/api/storacha${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error || 'Storacha request failed.');
  }

  return data;
}

export function getPreferredStorachaMode(): StorachaStorageMode {
  return 'app-owned';
}

export async function getStorachaStatus(): Promise<{
  hasAccount: boolean;
  walletSpaceDid?: string;
  mode: StorachaStorageMode;
}> {
  return {
    hasAccount: true,
    walletSpaceDid: 'zkly-app-owned',
    mode: 'app-owned',
  };
}

export async function uploadToStoracha(
  metadata: CredentialMetadata,
  walletAddress: string,
  options?: {
    signMessage?: WalletSigner;
    previousCid?: string;
  },
): Promise<string> {
  if (!options?.signMessage) {
    throw new Error('Reconnect your BTC wallet before using zkly-managed Storacha storage.');
  }

  const metadataJson = JSON.stringify(metadata, null, 2);
  const auth = await signAppOwnedRequest({
    action: 'upload',
    walletAddress,
    signMessage: options.signMessage,
    payloadHash: await sha256Hex(metadataJson),
    previousCid: options.previousCid,
  });
  const response = await appOwnedRequest<{ cid: string }>('/app/upload', {
    wallet_address: walletAddress,
    timestamp: auth.timestamp,
    signature: auth.signature,
    metadata_json: metadataJson,
    previous_cid: options.previousCid,
  });

  return response.cid;
}

export async function listStorachaFiles(
  walletAddress: string,
  options?: {
    signMessage?: WalletSigner;
  },
): Promise<{
  spaceDid: string;
  files: StorachaFileRecord[];
}> {
  if (!options?.signMessage) {
    throw new Error('Reconnect your BTC wallet before opening zkly-managed Storacha files.');
  }

  const auth = await signAppOwnedRequest({
    action: 'list',
    walletAddress,
    signMessage: options.signMessage,
    payloadHash: '-',
  });
  const response = await appOwnedRequest<{ files: StorachaFileRecord[] }>('/app/list', {
    wallet_address: walletAddress,
    timestamp: auth.timestamp,
    signature: auth.signature,
  });

  return {
    spaceDid: 'zkly-app-owned',
    files: response.files,
  };
}

export async function removeFromStoracha(
  cid: string,
  walletAddress: string,
  options?: {
    signMessage?: WalletSigner;
  },
): Promise<void> {
  if (!options?.signMessage) {
    throw new Error('Reconnect your BTC wallet before removing zkly-managed Storacha files.');
  }

  const auth = await signAppOwnedRequest({
    action: 'remove',
    walletAddress,
    signMessage: options.signMessage,
    payloadHash: await sha256Hex(cid),
  });
  await appOwnedRequest('/app/remove', {
    wallet_address: walletAddress,
    timestamp: auth.timestamp,
    signature: auth.signature,
    cid,
  });
}

export function getIpfsUrl(cid: string): string {
  return `${IPFS_GATEWAY}/${cid}`;
}

export async function isStorachaAvailable(): Promise<boolean> {
  return true;
}
