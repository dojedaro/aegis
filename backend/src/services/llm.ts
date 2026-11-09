import Anthropic from "@anthropic-ai/sdk";
import type {
  BetaMessage,
  BetaMessageParam,
  BetaToolUnion,
} from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { appConfig } from "../config.js";

/**
 * Thin wrapper around the Claude Messages API. Every model call in Aegis goes through
 * here, so the model ID, effort, refusal handling and fallbacks live in one place.
 */

export type Effort = "low" | "medium" | "high";

/** The subset of the SDK the app uses; tests inject a fake with the same shape. */
export interface MessagesApi {
  create(params: Record<string, unknown>): Promise<BetaMessage>;
}

export class LLMError extends Error {}

// Models that accept server-side refusal fallbacks routed by category.
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5"]);

export class LLMClient {
  constructor(
    private readonly messages: MessagesApi,
    readonly model: string = appConfig.ai.model,
    private readonly maxTokens: number = appConfig.ai.maxTokens
  ) {}

  /** Build a client from an API key, or return null (callers then run in demo mode). */
  static fromApiKey(apiKey: string | undefined, model?: string): LLMClient | null {
    if (!apiKey) return null;
    const sdk = new Anthropic({ apiKey });
    return new LLMClient(sdk.beta.messages as unknown as MessagesApi, model);
  }

  async create(options: {
    system?: string;
    messages: BetaMessageParam[];
    tools?: BetaToolUnion[];
    effort?: Effort;
    jsonSchema?: Record<string, unknown>;
  }): Promise<BetaMessage> {
    const params: Record<string, unknown> = {
      model: this.model,
      max_tokens: this.maxTokens,
      messages: options.messages,
      output_config: {
        effort: options.effort ?? "medium",
        // Structured outputs: the API guarantees JSON matching the schema.
        ...(options.jsonSchema && { format: { type: "json_schema", schema: options.jsonSchema } }),
      },
    };
    if (options.system) params.system = options.system;
    if (options.tools) params.tools = options.tools;
    if (FALLBACK_MODELS.has(this.model)) {
      // If a safety classifier declines, the API re-runs the request on a fallback model.
      params.betas = ["server-side-fallback-2026-07-01"];
      params.fallbacks = "default";
    }

    const response = await this.messages.create(params);
    if (response.stop_reason === "refusal") {
      throw new LLMError(`${this.model} declined the request`);
    }
    return response;
  }

  /** Single-turn call returning parsed JSON that conforms to ``schema``. */
  async json<T>(system: string, user: string, schema: Record<string, unknown>, effort: Effort = "medium"): Promise<T> {
    const response = await this.create({ system, messages: [{ role: "user", content: user }], jsonSchema: schema, effort });
    const text = textOf(response);
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new LLMError("Model returned invalid JSON");
    }
  }
}

/** Concatenate the text blocks of a response (thinking/tool blocks are skipped). */
export function textOf(message: BetaMessage): string {
  return message.content
    .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}
