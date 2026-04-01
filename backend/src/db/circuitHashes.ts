import { getDb } from "./schema.js";

export interface CircuitHashRow {
  circuit_hash: string;
  class_hash: string | null;
  deployed_address: string | null;
  deploy_tx_hash: string | null;
  deployed_at: string | null;
}

export function getCircuitHash(credential_type: string): CircuitHashRow | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT circuit_hash, class_hash, deployed_address, deploy_tx_hash, deployed_at FROM circuit_hashes WHERE credential_type = ?"
    )
    .get(credential_type) as CircuitHashRow | undefined;
  return row ?? null;
}

export function getCircuitHashByHash(circuit_hash: string): (CircuitHashRow & {
  credential_type: string;
}) | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT credential_type, circuit_hash, class_hash, deployed_address, deploy_tx_hash, deployed_at FROM circuit_hashes WHERE circuit_hash = ?"
    )
    .get(circuit_hash) as (CircuitHashRow & { credential_type: string }) | undefined;
  return row ?? null;
}

export function saveCircuitHash(
  credential_type: string,
  circuit_hash: string,
  class_hash?: string,
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO circuit_hashes (credential_type, circuit_hash, class_hash)
     VALUES (?, ?, ?)
     ON CONFLICT(credential_type) DO UPDATE SET
       circuit_hash = excluded.circuit_hash,
       class_hash = COALESCE(excluded.class_hash, circuit_hashes.class_hash)`
  ).run(credential_type, circuit_hash, class_hash ?? null);
}

export function saveCircuitDeployment(
  credential_type: string,
  deployed_address: string,
  deploy_tx_hash: string,
): void {
  const db = getDb();
  db.prepare(
    `UPDATE circuit_hashes
     SET deployed_address = ?,
         deploy_tx_hash = ?,
         deployed_at = datetime('now')
     WHERE credential_type = ?`
  ).run(deployed_address, deploy_tx_hash, credential_type);
}

export function getAllCircuitHashes(): Record<
  string,
  {
    circuit_hash: string;
    class_hash: string | null;
    deployed_address: string | null;
    deploy_tx_hash: string | null;
    deployed_at: string | null;
  }
> {
  const db = getDb();
  const rows = db
    .prepare(
      "SELECT credential_type, circuit_hash, class_hash, deployed_address, deploy_tx_hash, deployed_at FROM circuit_hashes"
    )
    .all() as {
    credential_type: string;
    circuit_hash: string;
    class_hash: string | null;
    deployed_address: string | null;
    deploy_tx_hash: string | null;
    deployed_at: string | null;
  }[];
  const result: Record<
    string,
    {
      circuit_hash: string;
      class_hash: string | null;
      deployed_address: string | null;
      deploy_tx_hash: string | null;
      deployed_at: string | null;
    }
  > = {};
  for (const row of rows) {
    result[row.credential_type] = {
      circuit_hash: row.circuit_hash,
      class_hash: row.class_hash,
      deployed_address: row.deployed_address,
      deploy_tx_hash: row.deploy_tx_hash,
      deployed_at: row.deployed_at,
    };
  }
  return result;
}
