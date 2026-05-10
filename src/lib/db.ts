import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DATA_DIR =
  process.env.DS_DATA_DIR ??
  path.join(process.cwd(), /*turbopackIgnore: true*/ "data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(path.join(DATA_DIR, "surgeon.db"));

// Wait up to 10s if DB is locked by another process (e.g. during build)
db.pragma("busy_timeout = 10000");
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY,
    action      TEXT NOT NULL,
    target_id   TEXT,
    target_name TEXT,
    bytes_freed INTEGER,
    success     INTEGER NOT NULL,
    error       TEXT,
    created_at  INTEGER DEFAULT (unixepoch())
  );
`);

export default db;
