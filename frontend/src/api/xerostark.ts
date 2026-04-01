/**
 * XeroStark API client — talks to the existing XeroStark backend
 * for circuit compilation, proof generation, and on-chain verification.
 */

const XEROSTARK_API_URL = import.meta.env.VITE_XEROSTARK_API_URL
  ? `${import.meta.env.VITE_XEROSTARK_API_URL}`
  : 'http://localhost:8000/api/v1';

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  return data;
};

const post = async (endpoint: string, body: unknown) => {
  const response = await fetch(`${XEROSTARK_API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(response);
};

const postText = async (endpoint: string, text: string) => {
  const response = await fetch(`${XEROSTARK_API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: text,
  });
  return handleResponse(response);
};

const get = async (endpoint: string) => {
  const response = await fetch(`${XEROSTARK_API_URL}${endpoint}`, { method: 'GET' });
  return handleResponse(response);
};

/**
 * Compile a circom circuit and declare the verifier contract on Starknet.
 * Returns class_hash, circuit_hash, input_signals, etc.
 */
export const setupCircuit = (
  circuitSource: string,
  address?: string,
  isPublic?: boolean,
  forceRedeploy?: boolean,
) => {
  const params = new URLSearchParams();
  if (address) params.set('address', address);
  if (isPublic !== undefined) params.set('is_public', String(isPublic));
  if (forceRedeploy) params.set('force_redeploy', 'true');
  const qs = params.toString();
  return postText(qs ? `/setup?${qs}` : '/setup', circuitSource);
};

/**
 * Generate a Groth16 proof for the given circuit and inputs.
 */
export const generateProof = (data: {
  circuit_hash: string;
  inputs: Record<string, string | string[]>;
}) => post('/prove', data);

/**
 * Get verification calldata for submitting proof on-chain.
 */
export const getVerifyCalldata = (data: {
  circuit_hash: string;
  proof: string;
  public_signals: string;
  created_by?: string;
}) => post('/verify', data);

/**
 * Register a verified proof after on-chain transaction.
 */
export const registerProof = (data: {
  circuit_hash: string;
  proof: string;
  public_signals: string;
  tx_hash: string;
  created_by?: string;
}) => post('/register-proof', data);

/**
 * Register a contract deployment.
 */
export const registerDeployment = (data: {
  circuit_hash: string;
  class_hash: string;
  contract_address: string;
  tx_hash?: string;
  deployed_by?: string;
}) => post('/register-deployment', data);

/**
 * Get circuit details by hash.
 */
export const getCircuitDetails = (circuitHash: string) =>
  get(`/circuit/${encodeURIComponent(circuitHash)}`);

/**
 * Share a proof and get a public token.
 */
export const shareProof = (proofId: number) => post(`/proofs/${proofId}/share`, {});

/**
 * Get a shared proof by token.
 */
export const getSharedProof = (token: string) => get(`/proofs/shared/${token}`);
