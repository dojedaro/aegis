import { describe, it, expect } from "vitest";
import { ComplianceAgentService, MAX_AGENT_TURNS, scoreFindings } from "../../src/services/agent.js";
import { LLMClient } from "../../src/services/llm.js";
import { RAGService } from "../../src/services/rag.js";
import { ScriptedMessages, text, toolUse } from "../helpers.js";

function agentWith(responses: ConstructorParameters<typeof ScriptedMessages>[0]) {
  const api = new ScriptedMessages(responses);
  const llm = new LLMClient(api, "claude-sonnet-5-5", 16000);
  return { api, agent: new ComplianceAgentService(llm, new RAGService(llm)) };
}

describe("ComplianceAgentService", () => {
  it("runs real tools, validates citations, and scores in code", async () => {
    const { api, agent } = agentWith([
      {
        stop_reason: "tool_use",
        content: [
          { type: "thinking", thinking: "", signature: "sig" } as any,
          toolUse("t1", "search_regulations", { query: "retention period records" }),
          toolUse("t2", "scan_pii", { excerpt: "contact: jane.doe@example.com" }),
        ],
      },
      {
        stop_reason: "tool_use",
        content: [
          // invented citation -> must be rejected
          toolUse("t3", "record_finding", { severity: "high", article_id: "gdpr-art-999", description: "d", recommendation: "r" }),
        ],
      },
      {
        stop_reason: "tool_use",
        content: [
          toolUse("t4", "record_finding", {
            severity: "high",
            article_id: "aml-art-40",
            description: "Records deleted after 1 year",
            recommendation: "Retain CDD records 5 years after relationship ends",
          }),
        ],
      },
      { stop_reason: "end_turn", content: [text("One high-severity retention issue.")] },
    ]);

    const result = await agent.analyzeCompliance("retention_days: 365\ncontact: jane.doe@example.com", ["aml"], "config");

    expect(result.mode).toBe("agentic");
    expect(result.analysis).toBe("One high-severity retention issue.");
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ id: "AML-001", severity: "high", article_id: "aml-art-40" });
    expect(result.score).toBe(85); // 100 - 15 (high), computed in code

    // Tool results are real: retrieval returned library articles, the PII scan masked the email.
    const turn2 = api.requests[1].messages;
    const toolResults = turn2[turn2.length - 1].content;
    expect(JSON.parse(toolResults[0].content).map((h: any) => h.article_id)).toContain("aml-art-40");
    expect(toolResults[1].content).toContain("j***@example.com");
    expect(toolResults[1].content).not.toContain("jane.doe@");

    // The invented article id came back as an error the model could correct.
    const turn3 = api.requests[2].messages;
    expect(turn3[turn3.length - 1].content[0]).toMatchObject({ is_error: true });

    // The assistant turn (including its thinking block) is passed back unchanged.
    expect(turn2[1]).toMatchObject({ role: "assistant" });
    expect(turn2[1].content[0].type).toBe("thinking");
  });

  it("stops at the turn limit", async () => {
    const loop = Array.from({ length: MAX_AGENT_TURNS }, (_, i) => ({
      stop_reason: "tool_use",
      content: [toolUse(`t${i}`, "search_regulations", { query: "consent" })],
    }));
    const { api, agent } = agentWith(loop);
    const result = await agent.analyzeCompliance("x", ["gdpr"], "config");
    expect(api.requests).toHaveLength(MAX_AGENT_TURNS);
    expect(result.actions_taken.at(-1)).toContain("turn");
  });

  it("propagates API errors instead of returning fabricated findings", async () => {
    const { agent } = agentWith([new Error("overloaded")]);
    await expect(agent.analyzeCompliance("x", ["gdpr"], "config")).rejects.toThrow("overloaded");
  });

  it("labels demo output when no API key is configured", async () => {
    const agent = new ComplianceAgentService(null, new RAGService(null));
    const result = await agent.analyzeCompliance("x", ["gdpr", "aml"], "config");
    expect(result.mode).toBe("demo");
    expect(result.analysis).toMatch(/demo/i);
  });

  it("scoreFindings is deterministic and floored at zero", () => {
    expect(scoreFindings([])).toBe(100);
    expect(scoreFindings([{ severity: "low" }, { severity: "medium" }])).toBe(89);
    expect(scoreFindings(Array(10).fill({ severity: "critical" }))).toBe(0);
  });
});
