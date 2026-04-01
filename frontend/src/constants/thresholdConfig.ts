import type { CredentialType } from '../circuits';

export interface ThresholdPreset {
  value: string;
  label: string;
  sublabel: string;
}

export interface ThresholdConfig {
  field: string;
  question: string;
  presets: ThresholdPreset[];
  customLabel: string;
  customPlaceholder: string;
  formatDisplay: (value: string) => string;
  toDisplayValue?: (raw: string) => string;
  fromDisplayValue?: (display: string) => string;
}

export const THRESHOLD_CONFIG: Record<CredentialType, ThresholdConfig> = {
  'btc-balance': {
    field: 'minBalance',
    question: 'What minimum BTC balance do you want to prove?',
    presets: [
      { value: '100000', label: '0.001', sublabel: 'BTC' },
      { value: '1000000', label: '0.01', sublabel: 'BTC' },
      { value: '10000000', label: '0.1', sublabel: 'BTC' },
      { value: '100000000', label: '1', sublabel: 'BTC' },
    ],
    customLabel: 'Amount in BTC',
    customPlaceholder: '0.05',
    formatDisplay: (v) => `≥ ${(Number(v) / 1e8).toFixed(8)} BTC`,
    toDisplayValue: (raw) => (Number(raw) / 1e8).toString(),
    fromDisplayValue: (display) => Math.round(Number(display) * 1e8).toString(),
  },
  'hodl-duration': {
    field: 'minMonths',
    question: 'How old should the wallet history signal be?',
    presets: [
      { value: '3', label: '3', sublabel: 'months' },
      { value: '6', label: '6', sublabel: 'months' },
      { value: '12', label: '1', sublabel: 'year' },
      { value: '24', label: '2', sublabel: 'years' },
    ],
    customLabel: 'Duration in months',
    customPlaceholder: '9',
    formatDisplay: (v) => `≥ ${v} months`,
  },
  'btc-reputation': {
    field: 'minScore',
    question: 'What reputation score do you want to prove?',
    presets: [
      { value: '25', label: '25', sublabel: 'Basic' },
      { value: '50', label: '50', sublabel: 'Established' },
      { value: '75', label: '75', sublabel: 'Strong' },
      { value: '90', label: '90', sublabel: 'Elite' },
    ],
    customLabel: 'Score (0–100)',
    customPlaceholder: '60',
    formatDisplay: (v) => `≥ ${v}/100`,
  },
};

export interface ExpiryOption {
  value: string;
  label: string;
  desc: string;
}

export const EXPIRY_OPTIONS: ExpiryOption[] = [
  { value: 'none', label: 'No expiry', desc: 'Valid forever' },
  { value: '7', label: '7 days', desc: 'Short-lived' },
  { value: '30', label: '30 days', desc: 'Monthly' },
  { value: '90', label: '90 days', desc: 'Quarterly' },
  { value: '365', label: '1 year', desc: 'Annual' },
  { value: 'custom', label: 'Custom', desc: 'Pick a date' },
];

export type WizardStep = 'threshold' | 'privacy' | 'expiry' | 'review' | 'generate';
export type ProveStep = 'input' | 'snapshot' | 'compiling' | 'proving' | 'done' | 'error';

export const PIPELINE_LABELS: { key: ProveStep; label: string }[] = [
  { key: 'snapshot', label: 'Snapshot' },
  { key: 'compiling', label: 'Compile' },
  { key: 'proving', label: 'Prove' },
];
