const API = import.meta.env.VITE_ZKLY_API_URL || 'http://localhost:3001';

const CIRCUIT_CACHE_VERSION: Record<string, string> = {
  'btc-balance': 'v3',
  'hodl-duration': 'v3',
  'btc-reputation': 'v3',
};

function getCircuitCacheKey(credentialType: string) {
  const version = CIRCUIT_CACHE_VERSION[credentialType];
  return version ? `${credentialType}:${version}` : credentialType;
}

export interface CachedCircuit {
  circuit_hash: string;
  class_hash?: string;
  deployed_address?: string;
  deploy_tx_hash?: string;
}

export const getCachedCircuitHash = async (
  credentialType: string,
): Promise<CachedCircuit | null> => {
  const cacheKey = getCircuitCacheKey(credentialType);
  try {
    const response = await fetch(
      `${API}/api/circuit-hashes/${encodeURIComponent(cacheKey)}`,
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.circuit_hash) return null;
    return {
      circuit_hash: data.circuit_hash,
      class_hash: data.class_hash || undefined,
      deployed_address: data.deployed_address || undefined,
      deploy_tx_hash: data.deploy_tx_hash || undefined,
    };
  } catch {
    return null;
  }
};

export const cacheCircuitHash = async (
  credentialType: string,
  circuitHash: string,
  classHash?: string,
): Promise<void> => {
  const cacheKey = getCircuitCacheKey(credentialType);
  await fetch(`${API}/api/circuit-hashes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credential_type: cacheKey,
      circuit_hash: circuitHash,
      class_hash: classHash,
    }),
  });
};
