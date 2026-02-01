import initSqlJs, { Database as SqlJsDatabase, SqlValue } from "sql.js";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../../data");
const DB_PATH = join(DATA_DIR, "aegis.db");

let db: SqlJsDatabase | null = null;

export async function initializeDatabase(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();

  // Ensure data directory exists
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  // Load existing database or create new
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
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
      factors TEXT NOT NULL,
      recommendations TEXT,
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
      frameworks TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed')),
      results TEXT,
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
      verification_result TEXT,
      verified_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- AI Analysis Cache
    CREATE TABLE IF NOT EXISTS ai_cache (
      cache_key TEXT PRIMARY KEY,
      response TEXT NOT NULL,
      model TEXT NOT NULL,
      tokens_used INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT
    );

    -- AI Usage Tracking
    CREATE TABLE IF NOT EXISTS ai_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      tokens_input INTEGER NOT NULL,
      tokens_output INTEGER NOT NULL,
      cost_usd REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_entries(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_entries(actor)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_risk ON audit_entries(risk_level)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_risk_entity ON risk_assessments(entity_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_compliance_target ON compliance_checks(target)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage(date)`);

  // Save to file
  saveDatabase();

  return db;
}

export function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(DB_PATH, buffer);
  }
}

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase() first.");
  }
  return db;
}

// Helper to run a query and get results as objects
export function query<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): T[] {
  const database = getDatabase();
  const stmt = database.prepare(sql);
  stmt.bind(params);

  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

// Helper to run a statement (INSERT, UPDATE, DELETE)
export function run(sql: string, params: SqlValue[] = []): void {
  const database = getDatabase();
  database.run(sql, params);
  saveDatabase();
}

// Helper to get a single row
export function get<T = Record<string, unknown>>(sql: string, params: SqlValue[] = []): T | undefined {
  const results = query<T>(sql, params);
  return results[0];
}

export type { SqlJsDatabase as Database };
