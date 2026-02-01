import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import { ClaudeService } from "../../src/services/claude.js";
import { createPIIRouter } from "../../src/routes/pii.js";

describe("PII Routes", () => {
  let app: express.Express;

  beforeAll(async () => {
    // Mock ClaudeService without database dependency for PII tests
    const claudeService = new ClaudeService({
      maxTokensPerRequest: 1024,
      dailyRequestLimit: 1000,
    });

    app = express();
    app.use(express.json());
    app.use("/api/pii", createPIIRouter(claudeService));
  });

  describe("POST /api/pii/scan", () => {
    it("should detect email addresses", async () => {
      const res = await request(app)
        .post("/api/pii/scan")
        .send({ content: "Contact john@example.com for more info" });

      expect(res.status).toBe(200);
      expect(res.body.pii_detected).toBe(true);
      expect(res.body.rule_based.findings.some((f: any) => f.type === "email")).toBe(true);
    });

    it("should detect phone numbers", async () => {
      const res = await request(app)
        .post("/api/pii/scan")
        .send({ content: "Call me at +1-555-123-4567" });

      expect(res.status).toBe(200);
      expect(res.body.pii_detected).toBe(true);
      expect(res.body.rule_based.findings.some((f: any) => f.type === "phone")).toBe(true);
    });

    it("should detect SSN patterns", async () => {
      const res = await request(app)
        .post("/api/pii/scan")
        .send({ content: "SSN: 123-45-6789" });

      expect(res.status).toBe(200);
      expect(res.body.pii_detected).toBe(true);
      expect(res.body.risk_level).toBe("high");
    });

    it("should detect credit card numbers", async () => {
      const res = await request(app)
        .post("/api/pii/scan")
        .send({ content: "Card: 4111-1111-1111-1111" });

      expect(res.status).toBe(200);
      expect(res.body.pii_detected).toBe(true);
      expect(res.body.risk_level).toBe("high");
    });

    it("should detect API keys", async () => {
      const res = await request(app)
        .post("/api/pii/scan")
        .send({ content: "const key_abcdefghij1234567890xyz = 'secret'" });

      expect(res.status).toBe(200);
      expect(res.body.pii_detected).toBe(true);
      expect(res.body.rule_based.findings.some((f: any) => f.type === "api_key")).toBe(true);
    });

    it("should return clean for safe content", async () => {
      const res = await request(app)
        .post("/api/pii/scan")
        .send({ content: "This is a safe message with no PII" });

      expect(res.status).toBe(200);
      expect(res.body.pii_detected).toBe(false);
      expect(res.body.risk_level).toBe("low");
    });

    it("should provide recommendations", async () => {
      const res = await request(app)
        .post("/api/pii/scan")
        .send({ content: "Email: test@example.com", context: "code" });

      expect(res.status).toBe(200);
      expect(res.body.recommendations.length).toBeGreaterThan(0);
    });

    it("should reject empty content", async () => {
      const res = await request(app)
        .post("/api/pii/scan")
        .send({ content: "" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/pii/redact", () => {
    it("should redact email addresses", async () => {
      const res = await request(app)
        .post("/api/pii/redact")
        .send({ content: "Contact john@example.com for info" });

      expect(res.status).toBe(200);
      expect(res.body.redacted_content).toContain("[REDACTED_EMAIL]");
      expect(res.body.redacted_content).not.toContain("john@example.com");
    });

    it("should redact multiple PII types", async () => {
      const res = await request(app)
        .post("/api/pii/redact")
        .send({ content: "Email: a@b.com, Phone: 555-123-4567" });

      expect(res.status).toBe(200);
      expect(res.body.redactions.length).toBe(2);
      expect(res.body.total_redacted).toBe(2);
    });

    it("should preserve safe content", async () => {
      const content = "This is safe content without PII";
      const res = await request(app)
        .post("/api/pii/redact")
        .send({ content });

      expect(res.status).toBe(200);
      expect(res.body.redacted_content).toBe(content);
      expect(res.body.total_redacted).toBe(0);
    });
  });
});
