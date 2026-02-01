import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import Database from "better-sqlite3";
import { ClaudeService } from "../../src/services/claude.js";
import { createComplianceRouter } from "../../src/routes/compliance.js";

describe("Compliance Routes", () => {
  let app: express.Express;
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(":memory:");
    db.exec(`
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
      CREATE TABLE IF NOT EXISTS audit_entries (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        actor TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        details TEXT,
        risk_level TEXT,
        compliance_relevant INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS ai_cache (
        cache_key TEXT PRIMARY KEY,
        response TEXT NOT NULL,
        model TEXT NOT NULL,
        tokens_used INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        expires_at TEXT
      );
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

    const claudeService = new ClaudeService(db, {
      maxTokensPerRequest: 1024,
      dailyRequestLimit: 1000,
    });

    app = express();
    app.use(express.json());
    app.use("/api/compliance", createComplianceRouter(db, claudeService));
  });

  afterAll(() => {
    db.close();
  });

  describe("POST /api/compliance/check", () => {
    it("should run compliance check for single framework", async () => {
      const res = await request(app)
        .post("/api/compliance/check")
        .send({
          target: "customer:C-12345",
          target_type: "customer",
          frameworks: ["gdpr"],
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe("completed");
      expect(res.body.score).toBeDefined();
      expect(res.body.results).toBeDefined();
    });

    it("should run compliance check for multiple frameworks", async () => {
      const res = await request(app)
        .post("/api/compliance/check")
        .send({
          target: "process:onboarding",
          target_type: "process",
          frameworks: ["gdpr", "aml", "eidas"],
        });

      expect(res.status).toBe(201);
      expect(res.body.frameworks).toEqual(["gdpr", "aml", "eidas"]);
      expect(res.body.results).toBeDefined();
    });

    it("should include EU AI Act framework", async () => {
      const res = await request(app)
        .post("/api/compliance/check")
        .send({
          target: "ai-system:kyc-verification",
          target_type: "process",
          frameworks: ["eu-ai-act"],
        });

      expect(res.status).toBe(201);
      expect(res.body.results["eu-ai-act"]).toBeDefined();
    });

    it("should reject invalid target_type", async () => {
      const res = await request(app)
        .post("/api/compliance/check")
        .send({
          target: "test",
          target_type: "invalid",
          frameworks: ["gdpr"],
        });

      expect(res.status).toBe(400);
    });

    it("should reject empty frameworks array", async () => {
      const res = await request(app)
        .post("/api/compliance/check")
        .send({
          target: "test",
          target_type: "customer",
          frameworks: [],
        });

      expect(res.status).toBe(400);
    });

    it("should create audit entry for check", async () => {
      await request(app)
        .post("/api/compliance/check")
        .send({
          target: "customer:audit-test",
          target_type: "customer",
          frameworks: ["gdpr"],
        });

      const entry = db.prepare("SELECT * FROM audit_entries WHERE resource = ?").get("customer:audit-test");
      expect(entry).toBeDefined();
    });
  });

  describe("GET /api/compliance", () => {
    it("should list compliance checks", async () => {
      const res = await request(app).get("/api/compliance");

      expect(res.status).toBe(200);
      expect(res.body.checks).toBeDefined();
      expect(Array.isArray(res.body.checks)).toBe(true);
    });
  });

  describe("GET /api/compliance/actions/stats", () => {
    it("should return compliance statistics", async () => {
      // Create some checks first
      await request(app)
        .post("/api/compliance/check")
        .send({
          target: "stats-test-1",
          target_type: "customer",
          frameworks: ["gdpr"],
        });

      const res = await request(app).get("/api/compliance/actions/stats");

      expect(res.status).toBe(200);
      expect(res.body.overview).toBeDefined();
      expect(res.body.overview.total_checks).toBeGreaterThan(0);
    });
  });
});
