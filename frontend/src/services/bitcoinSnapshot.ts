import * as poseidon from 'poseidon-lite';

const BLOCKSTREAM_API = import.meta.env.VITE_BLOCKSTREAM_API_URL || 'https://blockstream.info/api';
const BLOCKSTREAM_ENDPOINT_TEMPLATE = `${BLOCKSTREAM_API}/address/{{btcAddress}}`;
const SNAPSHOT_SCHEMA_ID = '4401';
const MONTH_SECONDS = 30 * 24 * 60 * 60;
const MAX_HISTORY_PAGES = 40;

export interface AddressDerivedMetrics {
  balance: string;
  totalReceived: string;
  txCount: string;
  unspentOutputCount: string;
  walletAgeMonths: string;
  snapshotTimestamp: string;
}

export interface AddressSnapshot {
  version: number;
  sourceApi: 'blockstream-bitcoin-address';
  endpointTemplate: string;
  schemaId: string;
  snapshotCommitment: string;
  derived: AddressDerivedMetrics;
}

interface BlockstreamAddressStats {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

interface BlockstreamAddressResponse {
  chain_stats?: BlockstreamAddressStats;
}

interface BlockstreamTx {
  txid: string;
  status?: {
    confirmed?: boolean;
    block_time?: number;
  };
}

function normalizeInteger(value: bigint | number) {
  return value.toString();
}

function computeWalletAgeMonths(snapshotTimestamp: number, oldestBlockTime: number) {
  if (!oldestBlockTime) return '0';
  return Math.max(0, Math.floor((snapshotTimestamp - oldestBlockTime) / MONTH_SECONDS)).toString();
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${BLOCKSTREAM_API}${path}`, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Blockstream request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchOldestConfirmedBlockTime(btcAddress: string) {
  let lastSeenTxId: string | null = null;
  let oldestBlockTime = 0;

  for (let pageIndex = 0; pageIndex < MAX_HISTORY_PAGES; pageIndex += 1) {
    const path: string = lastSeenTxId
      ? `/address/${encodeURIComponent(btcAddress)}/txs/chain/${lastSeenTxId}`
      : `/address/${encodeURIComponent(btcAddress)}/txs/chain`;

    const page: BlockstreamTx[] = await fetchJson<BlockstreamTx[]>(path);

    if (page.length === 0) {
      break;
    }

    for (let index = page.length - 1; index >= 0; index -= 1) {
      const tx = page[index];
      if (tx.status?.confirmed && tx.status.block_time) {
        oldestBlockTime = tx.status.block_time;
      }
    }

    if (page.length < 25) {
      break;
    }

    lastSeenTxId = page[page.length - 1]?.txid || null;
    if (!lastSeenTxId) {
      break;
    }
  }

  return oldestBlockTime;
}

async function computeSnapshotCommitment(inputs: Array<string | number | bigint>) {
  const values = inputs.map((value) => BigInt(value));
  const hash = (poseidon as Record<string, (args: bigint[]) => bigint>).poseidon7;

  if (!hash) {
    throw new Error('poseidon7 is not available in poseidon-lite.');
  }

  return hash(values).toString();
}

export async function fetchAddressSnapshot(btcAddress: string): Promise<AddressSnapshot> {
  const address = await fetchJson<BlockstreamAddressResponse>(
    `/address/${encodeURIComponent(btcAddress)}`,
  );
  const chainStats = address.chain_stats;

  if (!chainStats) {
    throw new Error('Blockstream response did not contain address stats.');
  }

  const snapshotTimestamp = Math.floor(Date.now() / 1000);
  const oldestBlockTime = await fetchOldestConfirmedBlockTime(btcAddress);
  const balance = BigInt(chainStats.funded_txo_sum) - BigInt(chainStats.spent_txo_sum);
  const unspentOutputCount = Math.max(
    0,
    chainStats.funded_txo_count - chainStats.spent_txo_count,
  );

  const derived: AddressDerivedMetrics = {
    balance: normalizeInteger(balance),
    totalReceived: normalizeInteger(chainStats.funded_txo_sum),
    txCount: normalizeInteger(chainStats.tx_count),
    unspentOutputCount: normalizeInteger(unspentOutputCount),
    walletAgeMonths: computeWalletAgeMonths(snapshotTimestamp, oldestBlockTime),
    snapshotTimestamp: normalizeInteger(snapshotTimestamp),
  };

  return {
    version: 1,
    sourceApi: 'blockstream-bitcoin-address',
    endpointTemplate: BLOCKSTREAM_ENDPOINT_TEMPLATE,
    schemaId: SNAPSHOT_SCHEMA_ID,
    snapshotCommitment: await computeSnapshotCommitment([
      derived.balance,
      derived.totalReceived,
      derived.txCount,
      derived.walletAgeMonths,
      derived.unspentOutputCount,
      derived.snapshotTimestamp,
      SNAPSHOT_SCHEMA_ID,
    ]),
    derived,
  };
}
