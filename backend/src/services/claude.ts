import { createHash } from "crypto";
import { get, run } from "../db/schema.js";
import { LLMClient, LLMError, textOf } from "./llm.js";

/** Where a result came from. Never present demo data as if a model produced it. */
export type ResultSource = "claude" | "cache" | "demo";

export interface AnalysisResult<T> {
  data: T;
  source: ResultSource;
  tokensUsed?: number;
}

export interface ComplianceAnalysis {
  findings: Array<{
    id: string;
    framework: string;
    severity: "low" | "medium" | "high";
    message: string;
    line: number | null;
  }>;
  score: number;
}

export interface PIIAnalysis {
  found: boolean;
  items: Array<{ type: string; pattern: string; risk: "low" | "medium" | "high" }>;
  recommendation: string;
}

export interface RiskAnalysis {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: Array<{ name: string; score: number; reason: string }>;
  recommendations: string[];
}

const COMPLIANCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["findings", "score"],
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "framework", "severity", "message", "line"],
        properties: {
          id: { type: "string" },
          framework: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          message: { type: "string" },
          line: { type: ["integer", "null"] },
        },
      },
    },
    score: { type: "integer", description: "0-100, higher is more compliant" },
  },
};

const PII_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["found", "items", "recommendation"],
  properties: {
    found: { type: "boolean" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["type", "pattern", "risk"],
        properties: {
          type: { type: "string" },
          pattern: { type: "string", description: "Masked example, never the raw value" },
          risk: { type: "string", enum: ["low", "medium", "high"] },
        },
      },
    },
    recommendation: { type: "string" },
  },
};

const RISK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["score", "level", "factors", "recommendations"],
  properties: {
    score: { type: "integer", description: "1-25 (likelihood x impact)" },
    level: { type: "string", enum: ["low", "medium", "high", "critical"] },
    factors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "score", "reason"],
        properties: { name: { type: "string" }, score: { type: "integer" }, reason: { type: "string" } },
      },
    },
    recommendations: { type: "array", items: { type: "string" } },
  },
};

// Approximate list price per token for usage reporting (Claude Sonnet 5.5: $2 / $10 per MTok).
const COST_PER_INPUT_TOKEN = 2 / 1_000_000;
const COST_PER_OUTPUT_TOKEN = 10 / 1_000_000;

export class ClaudeService {
  constructor(
    private readonly llm: LLMClient | null,
    private readonly dailyRequestLimit: number = 1000
  ) {}

  get isEnabled(): boolean {
    return this.llm !== null;
  }

  analyzeCompliance(code: string, frameworks: string[]): Promise<AnalysisResult<ComplianceAnalysis>> {
    const system = `You are a compliance analyst specializing in ${frameworks.join(", ")}.
Analyze the provided code or configuration for compliance issues. Be concise and specific.
Only report issues you can point to in the content; do not invent line numbers.`;
    return this.analyze("compliance", system, code, COMPLIANCE_SCHEMA, DEMO.compliance);
  }

  detectPII(text: string): Promise<AnalysisResult<PIIAnalysis>> {
    const system = `You are a PII detection specialist. Identify personally identifiable information in the text.
Report a masked pattern for each item (e.g. "j***@example.com"), never the raw value.`;
    return this.analyze("pii", system, text, PII_SCHEMA, DEMO.pii);
  }

  assessRisk(entityData: string): Promise<AnalysisResult<RiskAnalysis>> {
    const system = `You are a KYC/AML risk assessment specialist. Assess the entity on a 5x5 likelihood x impact
matrix (score 1-25) and explain each contributing factor.`;
    return this.analyze("risk", system, entityData, RISK_SCHEMA, DEMO.risk);
  }

  /**
   * Cached, budgeted structured analysis.
   * Without an API key this returns clearly labeled demo data. If the API call fails it
   * throws: silently substituting canned findings would fabricate compliance evidence.
   */
  private async analyze<T>(
    endpoint: string,
    system: string,
    content: string,
    schema: Record<string, unknown>,
    demo: T
  ): Promise<AnalysisResult<T>> {
    if (!this.llm) return { data: demo, source: "demo" };

    const cacheKey = createHash("sha256").update(`${this.llm.model}\n${system}\n${content}`).digest("hex");
    const cached = get<{ response: string }>(
      `SELECT response FROM ai_cache WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > datetime('now'))`,
      [cacheKey]
    );
    if (cached) return { data: JSON.parse(cached.response) as T, source: "cache" };

    if (!this.withinDailyLimit()) {
      throw new LLMError("Daily AI request limit reached");
    }

    const response = await this.llm.create({
      system,
      messages: [{ role: "user", content }],
      jsonSchema: schema,
    });
    let data: T;
    try {
      data = JSON.parse(textOf(response)) as T;
    } catch {
      throw new LLMError("Model returned invalid JSON");
    }

    const { input_tokens, output_tokens } = response.usage;
    this.trackUsage(endpoint, input_tokens, output_tokens);
    run(
      `INSERT OR REPLACE INTO ai_cache (cache_key, response, model, tokens_used, expires_at) VALUES (?, ?, ?, ?, datetime('now', '+1 day'))`,
      [cacheKey, JSON.stringify(data), this.llm.model, input_tokens + output_tokens]
    );

    return { data, source: "claude", tokensUsed: input_tokens + output_tokens };
  }

  private trackUsage(endpoint: string, tokensInput: number, tokensOutput: number): void {
    const date = new Date().toISOString().split("T")[0];
    const cost = tokensInput * COST_PER_INPUT_TOKEN + tokensOutput * COST_PER_OUTPUT_TOKEN;
    run(`INSERT INTO ai_usage (date, endpoint, tokens_input, tokens_output, cost_usd) VALUES (?, ?, ?, ?, ?)`, [
      date,
      endpoint,
      tokensInput,
      tokensOutput,
      cost,
    ]);
  }

  private withinDailyLimit(): boolean {
    const date = new Date().toISOString().split("T")[0];
    const row = get<{ count: number }>(`SELECT COUNT(*) as count FROM ai_usage WHERE date = ?`, [date]);
    return (row?.count ?? 0) < this.dailyRequestLimit;
  }

  async getUsageStats(): Promise<{ today: number; week: number; month: number; cost: number }> {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const row = get<{ today: number; week: number; month: number; cost: number }>(
      `
      SELECT
        COALESCE(SUM(CASE WHEN date = ? THEN 1 ELSE 0 END), 0) as today,
        COALESCE(SUM(CASE WHEN date >= ? THEN 1 ELSE 0 END), 0) as week,
        COALESCE(SUM(CASE WHEN date >= ? THEN 1 ELSE 0 END), 0) as month,
        COALESCE(SUM(cost_usd), 0) as cost
      FROM ai_usage
    `,
      [today, weekAgo, monthAgo]
    );

    return row ?? { today: 0, week: 0, month: 0, cost: 0 };
  }
}

/** Fixed sample output shown when no API key is configured (labeled source: "demo"). */
const DEMO = {
  compliance: {
    findings: [
      { id: "GDPR-001", framework: "gdpr", severity: "medium", message: "Personal data processing without explicit consent documentation", line: null },
      { id: "AML-001", framework: "aml", severity: "low", message: "Customer verification logging could be more detailed", line: null },
    ],
    score: 87,
  } satisfies ComplianceAnalysis,
  pii: {
    found: true,
    items: [
      { type: "email", pattern: "u***@example.com", risk: "medium" },
      { type: "phone", pattern: "+1-XXX-XXX-XXXX", risk: "low" },
    ],
    recommendation: "Replace with tokenized references or environment variables",
  } satisfies PIIAnalysis,
  risk: {
    score: 12,
    level: "medium",
    factors: [
      { name: "Geographic Risk", score: 3, reason: "Operations in medium-risk jurisdiction" },
      { name: "Transaction Pattern", score: 4, reason: "Occasional large transactions" },
      { name: "Customer Type", score: 2, reason: "Established business entity" },
      { name: "PEP Exposure", score: 3, reason: "Indirect connection to PEP" },
    ],
    recommendations: ["Enhanced monitoring recommended", "Quarterly review cycle"],
  } satisfies RiskAnalysis,
};
