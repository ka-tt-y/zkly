import { getDb } from "./schema.js";

export interface StorachaAppFileRow {
  cid: string;
  credential_type: string | null;
  created_at: string;
}

export function saveStorachaAppFile(
  walletHash: string,
  cid: string,
  credentialType?: string,
): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO storacha_app_files (wallet_hash, cid, credential_type)
     VALUES (?, ?, ?)
     ON CONFLICT(cid) DO UPDATE SET
       wallet_hash = excluded.wallet_hash,
       credential_type = COALESCE(excluded.credential_type, storacha_app_files.credential_type),
       deleted_at = NULL`
  ).run(walletHash, cid, credentialType ?? null);
}

export function listStorachaAppFiles(walletHash: string): StorachaAppFileRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT cid, credential_type, created_at
       FROM storacha_app_files
       WHERE wallet_hash = ? AND deleted_at IS NULL
       ORDER BY datetime(created_at) DESC`
    )
    .all(walletHash) as StorachaAppFileRow[];
}

export function findStorachaAppFile(walletHash: string, cid: string): StorachaAppFileRow | null {
  const db = getDb();
  return (
    (db
      .prepare(
        `SELECT cid, credential_type, created_at
         FROM storacha_app_files
         WHERE wallet_hash = ? AND cid = ? AND deleted_at IS NULL`
      )
      .get(walletHash, cid) as StorachaAppFileRow | undefined) ?? null
  );
}

export function markStorachaAppFileDeleted(walletHash: string, cid: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE storacha_app_files
     SET deleted_at = datetime('now')
     WHERE wallet_hash = ? AND cid = ?`
  ).run(walletHash, cid);
}
