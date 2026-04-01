import type { LucideIcon } from 'lucide-react';
import { Bitcoin, Clock, Star } from 'lucide-react';

export interface CredentialMeta {
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
}

export const CREDENTIAL_META: Record<string, CredentialMeta> = {
  'btc-balance': {
    name: 'BTC Balance',
    icon: Bitcoin,
    color: '#f59e0b',
    description:
      'Prove you hold at least a minimum amount of BTC without revealing your address or exact balance.',
  },
  'hodl-duration': {
    name: 'Hodl Duration',
    icon: Clock,
    color: '#6366f1',
    description:
      'Prove your Bitcoin history reaches a minimum age in months without revealing the wallet address behind it.',
  },
  'btc-reputation': {
    name: 'BTC Reputation Score',
    icon: Star,
    color: '#eab308',
    description:
      'Prove your Bitcoin reputation score meets a threshold — computed from balance, received volume, tx count, and wallet age.',
  },
};
