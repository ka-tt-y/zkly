
import {
  resolveSubjectCommitment,
  resolveSubjectDisplay,
  resolveSubjectDisplayMode,
  type SubjectDisplayMode,
} from './subjectIdentity';
import type { StorachaStorageMode } from '../services/storachaUpload';

const STORAGE_KEY = 'zkly-credentials';

export interface StoredCredential {
  id: string;
  ownerWalletAddress?: string;
  storachaStorageMode?: StorachaStorageMode;
  credentialType: string;
  credentialName: string;
  circuitHash: string;
  classHash?: string;
  publicSignals: string[];
  proof?: string;
  identityCommitment: string;
  subjectCommitment?: string;
  subjectDisplay?: string;
  subjectDisplayMode?: SubjectDisplayMode;
  storachaCid?: string;
  starknetTxHash?: string;
  starknetContractAddress?: string;
  createdAt: string;
  expiresAt?: string;
}

function normalizeCredential(input: StoredCredential): StoredCredential {
  return {
    ...input,
    subjectCommitment: resolveSubjectCommitment(input),
    subjectDisplay: resolveSubjectDisplay(input),
    subjectDisplayMode: resolveSubjectDisplayMode(input),
  };
}

function getAll(): StoredCredential[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as StoredCredential[]).map(normalizeCredential);
  } catch {
    return [];
  }
}

function saveAll(credentials: StoredCredential[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials.map(normalizeCredential)));
}

function isPersistedCredential(credential: StoredCredential): boolean {
  return Boolean(credential.storachaCid || credential.starknetTxHash);
}

/** Generate a simple UUID v4 */
function uuid(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Save a new credential. Returns the generated ID. */
export function saveCredentialLocal(
  data: Omit<StoredCredential, 'id' | 'createdAt'>,
): string {
  const credentials = getAll();
  const id = uuid();
  const entry: StoredCredential = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };
  credentials.unshift(entry); // newest first
  saveAll(credentials);
  return id;
}

/** Get all credentials, newest first. */
export function getCredentialsLocal(): StoredCredential[] {
  return getAll().filter(isPersistedCredential);
}

/** Get one credential by ID. */
export function getCredentialLocal(id: string): StoredCredential | null {
  return getAll().find((credential) => credential.id === id && isPersistedCredential(credential)) ?? null;
}

/** Update a credential's Storacha CID. */
export function updateStorachaCid(id: string, cid: string): void {
  const credentials = getAll();
  const entry = credentials.find((c) => c.id === id);
  if (entry) {
    entry.storachaCid = cid;
    saveAll(credentials);
  }
}

/** Update a credential's Starknet tx hash and contract address. */
export function updateStarknetInfo(
  id: string,
  txHash: string,
  contractAddress?: string,
): void {
  const credentials = getAll();
  const entry = credentials.find((c) => c.id === id);
  if (entry) {
    entry.starknetTxHash = txHash;
    if (contractAddress) entry.starknetContractAddress = contractAddress;
    saveAll(credentials);
  }
}

/** Delete a credential by ID. */
export function deleteCredentialLocal(id: string): void {
  const credentials = getAll().filter((c) => c.id !== id);
  saveAll(credentials);
}

/** Check if a credential has expired. */
export function isExpired(credential: StoredCredential): boolean {
  if (!credential.expiresAt) return false;
  return new Date(credential.expiresAt) < new Date();
}
