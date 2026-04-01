import type { AddressSnapshot } from '../services/bitcoinSnapshot';

function buildSharedSnapshotInputs(
  snapshot: AddressSnapshot,
  userValues: Record<string, string>,
) {
  const { derived } = snapshot;

  return {
    balance: derived.balance,
    totalReceived: derived.totalReceived,
    txCount: derived.txCount,
    walletAgeMonths: derived.walletAgeMonths,
    unspentOutputCount: derived.unspentOutputCount,
    snapshotTimestamp: derived.snapshotTimestamp,
    identitySecret: userValues.identitySecret || '0',
    salt: userValues.salt || '0',
    snapshotCommitment: snapshot.snapshotCommitment,
    subjectIdentifier: userValues.subjectIdentifier || '0',
  };
}

export function buildBtcBalanceInputs(
  snapshot: AddressSnapshot,
  userValues: Record<string, string>,
): Record<string, string> {
  return {
    ...buildSharedSnapshotInputs(snapshot, userValues),
    minBalance: userValues.minBalance || '0',
  };
}

export function buildHodlDurationInputs(
  snapshot: AddressSnapshot,
  userValues: Record<string, string>,
): Record<string, string> {
  return {
    ...buildSharedSnapshotInputs(snapshot, userValues),
    minMonths: userValues.minMonths || '0',
  };
}

export function buildBtcReputationInputs(
  snapshot: AddressSnapshot,
  userValues: Record<string, string>,
): Record<string, string> {
  return {
    ...buildSharedSnapshotInputs(snapshot, userValues),
    minScore: userValues.minScore || '0',
  };
}
