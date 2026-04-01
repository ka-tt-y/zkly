import type {
  CredentialMetadata,
  StorachaStorageMode,
} from '../services/storachaUpload';
import {
  resolveSubjectCommitment,
  resolveSubjectDisplay,
  resolveSubjectDisplayMode,
  type SubjectDisplayMode,
} from '../utils/subjectIdentity';


export interface ResultState {
  proof: string;
  publicSignals: string[];
  circuitHash: string;
  ownerWalletAddress?: string;
  storachaStorageMode?: StorachaStorageMode;
  /** Starknet class hash of the declared verifier contract */
  classHash?: string;
  credentialType: string;
  credentialName: string;
  sourceApi?: string;
  snapshotTimestamp?: string;
  verificationNetwork?: string;
  starknetTxHash?: string;
  starknetContractAddress?: string;
  expiresAt?: string;
  subjectDisplay?: string;
  subjectDisplayMode?: SubjectDisplayMode;
  subjectCommitment?: string;
  existingCredentialId?: string;
  existingStorachaCid?: string;
}


export interface IpfsMetadata {
  version?: number;
  type: string;
  publicSignals: string[];
  circuitHash: string;
  identityCommitment?: string;
  subjectCommitment?: string;
  subjectDisplay?: string;
  subjectDisplayMode?: SubjectDisplayMode;
  sourceApi?: string;
  snapshotTimestamp?: string;
  verificationNetwork?: string;
  starknetTxHash?: string;
  starknetContractAddress?: string;
  createdAt?: string;
  expiresAt?: string | null;
}


export type VerifyStep = 'idle' | 'calldata' | 'deploying' | 'verifying' | 'done' | 'error';

export function buildCredentialMetadata(
  resultState: ResultState,
  starknetTxHash?: string,
  starknetContractAddress?: string,
): CredentialMetadata {
  const identityCommitment = resultState.publicSignals[0] || '0';
  const subjectCommitment =
    resolveSubjectCommitment(resultState) ?? resultState.publicSignals[3] ?? '0';
  const resolvedTxHash = starknetTxHash || resultState.starknetTxHash;
  const resolvedContractAddress = starknetContractAddress || resultState.starknetContractAddress;

  return {
    version: 5,
    protocol: 'zkly',
    type: resultState.credentialType,
    publicSignals: resultState.publicSignals,
    circuitHash: resultState.circuitHash,
    identityCommitment,
    subjectCommitment: subjectCommitment !== '0' ? subjectCommitment : undefined,
    subjectDisplay: resolveSubjectDisplay(resultState),
    subjectDisplayMode: resolveSubjectDisplayMode(resultState),
    sourceApi: resultState.sourceApi || 'blockstream-bitcoin-address',
    snapshotTimestamp: resultState.snapshotTimestamp,
    verificationNetwork: resultState.verificationNetwork || 'starknet',
    starknetTxHash: resolvedTxHash,
    starknetContractAddress: resolvedContractAddress,
    createdAt: new Date().toISOString(),
    expiresAt: resultState.expiresAt || null,
  };
}
