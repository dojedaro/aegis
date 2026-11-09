import { describe, it, expect, beforeAll } from "vitest";
import { initializeDatabase } from "../../src/db/schema.js";
import { ClaudeService } from "../../src/services/claude.js";
import { LLMClient, LLMError, textOf } from "../../src/services/llm.js";
import { ScriptedMessages, text } from "../helpers.js";

describe("LLMClient", () => {
  it("sends effort and structured-output schema, never sampling params", async () => {
    const api = new ScriptedMessages([{ content: [text('{"ok":true}')] }]);
    const llm = new LLMClient(api, "claude-sonnet-5-5", 16000);
    const result = await llm.json<{ ok: boolean }>("sys", "user", { type: "object" }, "low");

    expect(result).toEqual({ ok: true });
    const params = api.requests[0];
    expect(params.output_config).toEqual({ effort: "low", format: { type: "json_schema", schema: { type: "object" } } });
    expect(params).not.toHaveProperty("temperature");
  });

  it("enables server-side fallbacks only on supported models", async () => {
    const sonnet = new ScriptedMessages([{ content: [text("hi")] }]);
    await new LLMClient(sonnet, "claude-sonnet-5-5").create({ messages: [{ role: "user", content: "x" }] });
    expect(sonnet.requests[0]).toMatchObject({ fallbacks: "default", betas: ["server-side-fallback-2026-07-01"] });

    const haiku = new ScriptedMessages([{ content: [text("hi")] }]);
    await new LLMClient(haiku, "claude-haiku-5-5").create({ messages: [{ role: "user", content: "x" }] });
    expect(haiku.requests[0]).not.toHaveProperty("fallbacks");
  });

  it("raises on refusal", async () => {
    const api = new ScriptedMessages([{ stop_reason: "refusal", content: [] }]);
    await expect(new LLMClient(api).create({ messages: [{ role: "user", content: "x" }] })).rejects.toThrow(LLMError);
  });

  it("textOf skips thinking blocks", () => {
    const message = { content: [{ type: "thinking", thinking: "" }, text("answer")] } as any;
    expect(textOf(message)).toBe("answer");
  });
});

describe("ClaudeService result sources", () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  it("labels demo data when no key is configured", async () => {
    const result = await new ClaudeService(null).analyzeCompliance("code", ["gdpr"]);
    expect(result.source).toBe("demo");
  });

  it("calls Claude once, then serves the cache", async () => {
    const payload = { findings: [], score: 97 };
    const api = new ScriptedMessages([{ content: [text(JSON.stringify(payload))] }]);
    const service = new ClaudeService(new LLMClient(api, "claude-sonnet-5-5"));

    const first = await service.analyzeCompliance("unique content 1", ["gdpr"]);
    const second = await service.analyzeCompliance("unique content 1", ["gdpr"]);

    expect(first).toMatchObject({ source: "claude", data: payload, tokensUsed: 15 });
    expect(second).toMatchObject({ source: "cache", data: payload });
    expect(api.requests).toHaveLength(1);
  });

  it("throws on API failure instead of substituting demo findings", async () => {
    const api = new ScriptedMessages([new Error("503 overloaded")]);
    const service = new ClaudeService(new LLMClient(api));
    await expect(service.analyzeCompliance("unique content 2", ["gdpr"])).rejects.toThrow("503");
  });
});
