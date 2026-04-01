import { CREDENTIAL_META } from '../constants/credentialMeta';

export type { CredentialMeta } from '../constants/credentialMeta';
export { CREDENTIAL_META };

export interface Claim {
  label: string;
  value: string;
}

/**
 * Interpret public signals from a ZK proof into human-readable claims.
 *
 * Circom public signal order: outputs first, then public inputs in declaration order.
 * All 3 circuits have the same output/input structure:
 *   [0] identityCommitment  (output)
 *   [1] threshold            (public input — minBalance / minMonths / minScore)
 *   [2] snapshotCommitment   (public input)
 *   [3] subjectIdentifier    (public input — 0 = anonymous)
 */
export const interpretSignals = (type: string, signals: string[]): Claim[] => {
  const threshold = signals[1] || '0';
  const identityCommitment = signals[0] || '0';
  const snapshotCommitment = signals[2] || '0';
  const subjectIdentifier = signals[3] || '0';

  const claims: Claim[] = [];

  switch (type) {
    case 'btc-balance':
      claims.push({
        label: 'Minimum BTC balance',
        value: `≥ ${(Number(threshold) / 1e8).toFixed(8)} BTC`,
      });
      break;
    case 'hodl-duration':
      claims.push({
        label: 'Minimum hodl duration',
        value: `≥ ${threshold} months`,
      });
      break;
    case 'btc-reputation':
      claims.push({
        label: 'Minimum reputation score',
        value: `≥ ${threshold}/100`,
      });
      break;
    default:
      return signals.map((s, i) => ({
        label: `Signal ${i}`,
        value: s.length > 24 ? s.slice(0, 20) + '…' : s,
      }));
  }

  // Add identity commitment (truncated for display)
  if (identityCommitment !== '0') {
    claims.push({
      label: 'Identity commitment',
      value: identityCommitment.length > 16
        ? identityCommitment.slice(0, 8) + '…' + identityCommitment.slice(-4)
        : identityCommitment,
    });
  }

  if (snapshotCommitment !== '0') {
    claims.push({
      label: 'Snapshot commitment',
      value: snapshotCommitment.length > 16
        ? snapshotCommitment.slice(0, 8) + '…' + snapshotCommitment.slice(-4)
        : snapshotCommitment,
    });
  }

  // Add subject identifier if non-anonymous
  if (subjectIdentifier !== '0') {
    claims.push({
      label: 'Subject identifier',
      value: subjectIdentifier.length > 16
        ? subjectIdentifier.slice(0, 8) + '…' + subjectIdentifier.slice(-4)
        : subjectIdentifier,
    });
  }

  return claims;
};
