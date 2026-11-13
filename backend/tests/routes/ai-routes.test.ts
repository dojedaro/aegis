import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { get } from "../../src/db/schema.js";
import { LLMClient } from "../../src/services/llm.js";
import { buildTestApp, ScriptedMessages, text } from "../helpers.js";

describe("AI-backed routes", () => {
  // Failure-path tests make the app log an error on purpose: capture it so it's asserted, not printed.
  const consoleError = () => vi.spyOn(console, "error").mockImplementation(() => {});
  afterEach(() => vi.restoreAllMocks());

  it("marks a compliance check failed (502) when the model call fails", async () => {
    const logged = consoleError();
    const app = await buildTestApp(new LLMClient(new ScriptedMessages([new Error("boom")])));
    const res = await request(app)
      .post("/api/compliance/check")
      .send({ target: "svc-a", target_type: "config", frameworks: ["gdpr"], content: "user_email: a@b.com" });

    expect(res.status).toBe(502);
    expect(logged).toHaveBeenCalled();
    expect(get<{ status: string }>("SELECT status FROM compliance_checks WHERE id = ?", [res.body.id])?.status).toBe(
      "failed"
    );
  });

  it("labels sample compliance results as demo", async () => {
    const app = await buildTestApp();
    const res = await request(app)
      .post("/api/compliance/check")
      .send({ target: "svc-b", target_type: "customer", frameworks: ["gdpr", "aml"] });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe("demo");
  });

  it("returns the rule-based risk result, labeled, when AI is off", async () => {
    const app = await buildTestApp();
    const body = { entity_id: "C-1", entity_type: "customer", data: { sanctions_hit: true } };
    const first = await request(app).post("/api/risk/assess").send(body);
    const second = await request(app).post("/api/risk/assess").send(body);

    expect(first.status).toBe(201);
    expect(first.body).toMatchObject({ source: "rules", level: "critical" });
    expect(second.body.score).toBe(first.body.score);
  });

  it("falls back to rules (and says so) when AI risk scoring fails", async () => {
    const logged = consoleError();
    const app = await buildTestApp(new LLMClient(new ScriptedMessages([new Error("timeout")])));
    const res = await request(app)
      .post("/api/risk/assess")
      .send({ entity_id: "C-2", entity_type: "customer", data: { pep: true } });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe("rules");
    expect(res.body.ai_error).toBeDefined();
    expect(logged).toHaveBeenCalled();
  });

  it("grounds RAG answers in retrieved articles and labels the source", async () => {
    const api = new ScriptedMessages([{ content: [text("Keep CDD records for 5 years (AML Art. 40).")] }]);
    const app = await buildTestApp(new LLMClient(api));
    const res = await request(app)
      .post("/api/regulations/query")
      .send({ question: "How long must KYC records be retained?" });

    expect(res.status).toBe(200);
    expect(res.body.answer_source).toBe("claude");
    expect(res.body.sources.map((s: any) => s.id)).toContain("aml-art-40");
    expect(api.requests[0].messages[0].content).toContain("Article 40 - Record keeping");
  });

  it("validates agent input", async () => {
    const app = await buildTestApp();
    expect((await request(app).post("/api/agent/analyze").send({})).status).toBe(400);
    expect((await request(app).post("/api/agent/analyze").send({ content: "x", frameworks: ["hipaa"] })).status).toBe(
      400
    );
    const demo = await request(app).post("/api/agent/analyze").send({ content: "x" });
    expect(demo.body.mode).toBe("demo");
  });
});
