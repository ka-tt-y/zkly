import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "..", "zkly.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  const database = getDb();

  database.exec(`
    -- Circuit cache (maps credential type → XeroStark circuit hash, class hash,
    -- and the verifier deployment handled by zkly's backend relayer)
    CREATE TABLE IF NOT EXISTS circuit_hashes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credential_type TEXT NOT NULL UNIQUE,
      circuit_hash TEXT NOT NULL,
      class_hash TEXT,
      deployed_address TEXT,
      deploy_tx_hash TEXT,
      deployed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_circuit_hashes_type ON circuit_hashes(credential_type);

    CREATE TABLE IF NOT EXISTS storacha_app_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_hash TEXT NOT NULL,
      cid TEXT NOT NULL UNIQUE,
      credential_type TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_storacha_app_files_wallet_hash
      ON storacha_app_files(wallet_hash);
  `);

  // Migrations for existing DBs.
  try {
    database.exec(`ALTER TABLE circuit_hashes ADD COLUMN class_hash TEXT`);
  } catch {
    // Column already exists.
  }

  try {
    database.exec(`ALTER TABLE circuit_hashes ADD COLUMN deployed_address TEXT`);
  } catch {
    // Column already exists.
  }

  try {
    database.exec(`ALTER TABLE circuit_hashes ADD COLUMN deploy_tx_hash TEXT`);
  } catch {
    // Column already exists.
  }

  try {
    database.exec(`ALTER TABLE circuit_hashes ADD COLUMN deployed_at TEXT`);
  } catch {
    // Column already exists.
  }

  try {
    database.exec(`ALTER TABLE storacha_app_files ADD COLUMN credential_type TEXT`);
  } catch {
    // Column already exists.
  }

  try {
    database.exec(`ALTER TABLE storacha_app_files ADD COLUMN deleted_at TEXT`);
  } catch {
    // Column already exists.
  }
}
