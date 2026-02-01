import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function initializeDatabase(): Database.Database {
  const dbPath = join(__dirname, "../../data/aegis.db");
  const db = new Database(dbPath);

  // Enable WAL mode for better concurrency
  db.pragma("journal_mode = WAL");

  // Create tables
  db.exec(`
    -- Audit Trail
    CREATE TABLE IF NOT EXISTS audit_entries (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      details TEXT,
      risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
      compliance_relevant INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Risk Assessments
    CREATE TABLE IF NOT EXISTS risk_assessments (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
      factors TEXT NOT NULL, -- JSON array
      recommendations TEXT, -- JSON array
      assessed_by TEXT NOT NULL,
      assessed_at TEXT NOT NULL,
      next_review TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Compliance Checks
    CREATE TABLE IF NOT EXISTS compliance_checks (
      id TEXT PRIMARY KEY,
      target TEXT NOT NULL,
      target_type TEXT NOT NULL,
      frameworks TEXT NOT NULL, -- JSON array of framework IDs
      status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed')),
      results TEXT, -- JSON object with findings
      score INTEGER,
      checked_by TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Credentials
    CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      issuer TEXT NOT NULL,
      subject TEXT NOT NULL,
      issued_at TEXT NOT NULL,
      expires_at TEXT,
      status TEXT CHECK(status IN ('valid', 'expired', 'revoked', 'invalid')),
      verification_result TEXT, -- JSON object
      verified_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- AI Analysis Cache (for demo mode and rate limiting)
    CREATE TABLE IF NOT EXISTS ai_cache (
      cache_key TEXT PRIMARY KEY,
      response TEXT NOT NULL,
      model TEXT NOT NULL,
      tokens_used INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT
    );

    -- AI Usage Tracking (for safety/billing)
    CREATE TABLE IF NOT EXISTS ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      tokens_input INTEGER NOT NULL,
      tokens_output INTEGER NOT NULL,
      cost_usd REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_entries(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_entries(actor);
    CREATE INDEX IF NOT EXISTS idx_audit_risk ON audit_entries(risk_level);
    CREATE INDEX IF NOT EXISTS idx_risk_entity ON risk_assessments(entity_id);
    CREATE INDEX IF NOT EXISTS idx_compliance_target ON compliance_checks(target);
    CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage(date);
  `);

  return db;
}

export type { Database };
