import type { BetaMessage } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { createApp } from "../src/app.js";
import { initializeDatabase } from "../src/db/schema.js";
import { signToken, AuthUser } from "../src/middleware/auth.js";
import { ClaudeService } from "../src/services/claude.js";
import { LLMClient, MessagesApi } from "../src/services/llm.js";
import { RAGService } from "../src/services/rag.js";
import { ComplianceAgentService } from "../src/services/agent.js";

/** Build the full app (real middleware, in-memory DB). Pass an LLMClient to enable AI. */
export async function buildTestApp(llm: LLMClient | null = null) {
  await initializeDatabase();
  const ragService = new RAGService(llm);
  return createApp({
    claudeService: new ClaudeService(llm),
    ragService,
    agentService: new ComplianceAgentService(llm, ragService),
  });
}

export function bearer(role: AuthUser["role"], email = `${role}@safeco.com`): string {
  return `Bearer ${signToken({ id: `test-${role}`, email, role })}`;
}

/** A fake Messages API that replays scripted responses and records every request. */
export class ScriptedMessages implements MessagesApi {
  readonly requests: Record<string, any>[] = [];
  constructor(private readonly responses: Array<Partial<BetaMessage> | Error>) {}

  async create(params: Record<string, unknown>): Promise<BetaMessage> {
    this.requests.push(structuredClone(params));
    const next = this.responses.shift();
    if (!next) throw new Error("ScriptedMessages: no response left");
    if (next instanceof Error) throw next;
    return {
      id: "msg_test",
      type: "message",
      role: "assistant",
      model: "test-model",
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 5 },
      content: [],
      ...next,
    } as BetaMessage;
  }
}

export const text = (t: string) => ({ type: "text", text: t, citations: null }) as const;
export const toolUse = (id: string, name: string, input: Record<string, unknown>) =>
  ({ type: "tool_use", id, name, input }) as const;
