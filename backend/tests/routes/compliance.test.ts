import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import request from "supertest";
import { initializeDatabase, query, run } from "../../src/db/schema.js";
import { ClaudeService } from "../../src/services/claude.js";
import { createComplianceRouter } from "../../src/routes/compliance.js";

describe("Compliance Routes", () => {
  let app: express.Express;

  beforeAll(async () => {
    // Initialize database first
    await initializeDatabase();

    const claudeService = new ClaudeService({
      maxTokensPerRequest: 1024,
      dailyRequestLimit: 1000,
    });

    app = express();
    app.use(express.json());
    app.use("/api/compliance", createComplianceRouter(claudeService));
  });

  afterAll(() => {
    // Clean up test data
    run("DELETE FROM compliance_checks WHERE target LIKE 'test-%'", []);
    run("DELETE FROM audit_entries WHERE resource LIKE 'test-%'", []);
  });

  describe("POST /api/compliance/check", () => {
    it("should run compliance check for single framework", async () => {
      const res = await request(app)
        .post("/api/compliance/check")
        .send({
          target: "test-customer:C-12345",
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
          target: "test-process:onboarding",
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
          target: "test-ai-system:kyc-verification",
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
      const res = await request(app).get("/api/compliance/actions/stats");

      expect(res.status).toBe(200);
      expect(res.body.overview).toBeDefined();
    });
  });
});
