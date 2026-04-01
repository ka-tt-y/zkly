export { BTC_BALANCE_CIRCUIT, BTC_BALANCE_INFO } from './btcBalance';
export { HODL_DURATION_CIRCUIT, HODL_DURATION_INFO } from './hodlDuration';
export {
  REPUTATION_SCORE_CREDENTIAL_CIRCUIT,
  REPUTATION_SCORE_CREDENTIAL_INFO,
} from './reputationScoreCredential';

export type CredentialType = 'btc-balance' | 'hodl-duration' | 'btc-reputation';

export const CIRCUITS = {
  'btc-balance': {
    circuit: () => import('./btcBalance').then((m) => m.BTC_BALANCE_CIRCUIT),
    info: () => import('./btcBalance').then((m) => m.BTC_BALANCE_INFO),
  },
  'hodl-duration': {
    circuit: () => import('./hodlDuration').then((m) => m.HODL_DURATION_CIRCUIT),
    info: () => import('./hodlDuration').then((m) => m.HODL_DURATION_INFO),
  },
  'btc-reputation': {
    circuit: () =>
      import('./reputationScoreCredential').then(
        (m) => m.REPUTATION_SCORE_CREDENTIAL_CIRCUIT,
      ),
    info: () =>
      import('./reputationScoreCredential').then(
        (m) => m.REPUTATION_SCORE_CREDENTIAL_INFO,
      ),
  },
} as const;

export const CREDENTIAL_TYPES: {
  type: CredentialType;
  name: string;
  description: string;
  icon: string;
}[] = [
  {
    type: 'btc-balance',
    name: 'BTC Balance',
    description:
      'Prove you hold at least a minimum amount of BTC without revealing your address or exact balance.',
    icon: '₿',
  },
  {
    type: 'hodl-duration',
    name: 'Hodl Duration',
    description:
      'Prove you have held BTC for at least a minimum number of months based on your oldest UTXO.',
    icon: '⏳',
  },
  {
    type: 'btc-reputation',
    name: 'BTC Reputation Score',
    description:
      'Prove your Bitcoin reputation score meets a threshold without revealing the underlying metrics.',
    icon: '⭐',
  },
];
