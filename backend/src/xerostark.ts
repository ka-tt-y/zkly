function getXeroStarkApiUrl() {
  const configured = process.env.XEROSTARK_API_URL;

  if (!configured) {
    throw new Error(
      "XEROSTARK_API_URL is not set in backend/.env. Point it to your XeroStark backend.",
    );
  }
  const trimmed = configured.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

async function handleResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.message || data.error || `XeroStark request failed (${response.status})`);
  }
  return data;
}

async function post(endpoint: string, body: unknown) {
  const apiUrl = getXeroStarkApiUrl();

  try {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof Error && error.message.includes("fetch failed")) {
      throw new Error(
        `Could not reach XeroStark at ${apiUrl}. Make sure the XeroStark backend is running and XEROSTARK_API_URL is correct in backend/.env.`,
      );
    }

    throw error;
  }
}

export async function getVerifyCalldata(data: {
  circuit_hash: string;
  proof: string;
  public_signals: string;
  created_by?: string;
}) {
  return post("/verify", data);
}

export async function registerProof(data: {
  circuit_hash: string;
  proof: string;
  public_signals: string;
  tx_hash: string;
  created_by?: string;
}) {
  return post("/register-proof", data);
}

export async function registerDeployment(data: {
  circuit_hash: string;
  class_hash: string;
  contract_address: string;
  tx_hash?: string;
  deployed_by?: string;
}) {
  return post("/register-deployment", data);
}
