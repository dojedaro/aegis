import Anthropic from "@anthropic-ai/sdk";
import type { Database } from "better-sqlite3";

interface AIConfig {
  apiKey?: string;
  maxTokensPerRequest: number;
  dailyRequestLimit: number;
}

interface AnalysisResult {
  content: string;
  cached: boolean;
  tokensUsed?: number;
}

export class ClaudeService {
  private client: Anthropic | null = null;
  private config: AIConfig;
  private db: Database;

  constructor(db: Database, config: AIConfig) {
    this.db = db;
    this.config = config;

    if (config.apiKey) {
      this.client = new Anthropic({ apiKey: config.apiKey });
    }
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  private getCacheKey(prompt: string, systemPrompt: string): string {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(`${systemPrompt}:${prompt}`).digest("hex");
  }

  private getFromCache(cacheKey: string): string | null {
    const stmt = this.db.prepare(`
      SELECT response FROM ai_cache
      WHERE cache_key = ? AND (expires_at IS NULL OR expires_at > datetime('now'))
    `);
    const row = stmt.get(cacheKey) as { response: string } | undefined;
    return row?.response ?? null;
  }

  private saveToCache(cacheKey: string, response: string, model: string, tokens: number): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO ai_cache (cache_key, response, model, tokens_used, expires_at)
      VALUES (?, ?, ?, ?, datetime('now', '+1 day'))
    `);
    stmt.run(cacheKey, response, model, tokens);
  }

  private trackUsage(endpoint: string, tokensInput: number, tokensOutput: number): void {
    const date = new Date().toISOString().split("T")[0];
    const costPerInputToken = 0.000003; // Claude Sonnet pricing estimate
    const costPerOutputToken = 0.000015;
    const cost = tokensInput * costPerInputToken + tokensOutput * costPerOutputToken;

    const stmt = this.db.prepare(`
      INSERT INTO ai_usage (date, endpoint, tokens_input, tokens_output, cost_usd)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(date, endpoint, tokensInput, tokensOutput, cost);
  }

  private checkDailyLimit(): boolean {
    const date = new Date().toISOString().split("T")[0];
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM ai_usage WHERE date = ?
    `);
    const row = stmt.get(date) as { count: number };
    return row.count < this.config.dailyRequestLimit;
  }

  async analyzeCompliance(code: string, frameworks: string[]): Promise<AnalysisResult> {
    const systemPrompt = `You are a compliance analyst specializing in ${frameworks.join(", ")}.
Analyze the provided code for compliance issues. Be concise and specific.
Return JSON with: { "findings": [{ "id": string, "framework": string, "severity": "low"|"medium"|"high", "message": string, "line": number|null }], "score": number }`;

    return this.analyze(code, systemPrompt, "compliance");
  }

  async detectPII(text: string): Promise<AnalysisResult> {
    const systemPrompt = `You are a PII detection specialist. Analyze the text for personally identifiable information.
Return JSON with: { "found": boolean, "items": [{ "type": string, "pattern": string, "risk": "low"|"medium"|"high" }], "recommendation": string }`;

    return this.analyze(text, systemPrompt, "pii");
  }

  async assessRisk(entityData: string): Promise<AnalysisResult> {
    const systemPrompt = `You are a risk assessment specialist for KYC/AML. Analyze the entity data and provide a risk assessment.
Return JSON with: { "score": number (1-25), "level": "low"|"medium"|"high"|"critical", "factors": [{ "name": string, "score": number, "reason": string }], "recommendations": string[] }`;

    return this.analyze(entityData, systemPrompt, "risk");
  }

  private async analyze(content: string, systemPrompt: string, endpoint: string): Promise<AnalysisResult> {
    const cacheKey = this.getCacheKey(content, systemPrompt);

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return { content: cached, cached: true };
    }

    // If no API key, return demo response
    if (!this.client) {
      return this.getDemoResponse(endpoint);
    }

    // Check daily limit
    if (!this.checkDailyLimit()) {
      console.warn("Daily AI request limit reached, using cached/demo response");
      return this.getDemoResponse(endpoint);
    }

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: this.config.maxTokensPerRequest,
        system: systemPrompt,
        messages: [{ role: "user", content }],
      });

      const textContent = response.content.find((c) => c.type === "text");
      const result = textContent?.text ?? "";

      // Track usage
      this.trackUsage(
        endpoint,
        response.usage.input_tokens,
        response.usage.output_tokens
      );

      // Cache result
      this.saveToCache(
        cacheKey,
        result,
        "claude-sonnet-4-20250514",
        response.usage.input_tokens + response.usage.output_tokens
      );

      return {
        content: result,
        cached: false,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
      };
    } catch (error) {
      console.error("Claude API error:", error);
      return this.getDemoResponse(endpoint);
    }
  }

  private getDemoResponse(endpoint: string): AnalysisResult {
    const demoResponses: Record<string, string> = {
      compliance: JSON.stringify({
        findings: [
          { id: "GDPR-001", framework: "gdpr", severity: "medium", message: "Personal data processing without explicit consent documentation", line: 45 },
          { id: "AML-001", framework: "aml", severity: "low", message: "Customer verification logging could be more detailed", line: 78 },
        ],
        score: 87,
      }),
      pii: JSON.stringify({
        found: true,
        items: [
          { type: "email", pattern: "user@example.com", risk: "medium" },
          { type: "phone", pattern: "+1-XXX-XXX-XXXX", risk: "low" },
        ],
        recommendation: "Replace with tokenized references or environment variables",
      }),
      risk: JSON.stringify({
        score: 12,
        level: "medium",
        factors: [
          { name: "Geographic Risk", score: 3, reason: "Operations in medium-risk jurisdiction" },
          { name: "Transaction Pattern", score: 4, reason: "Occasional large transactions" },
          { name: "Customer Type", score: 2, reason: "Established business entity" },
          { name: "PEP Exposure", score: 3, reason: "Indirect connection to PEP" },
        ],
        recommendations: ["Enhanced monitoring recommended", "Quarterly review cycle"],
      }),
    };

    return {
      content: demoResponses[endpoint] ?? "{}",
      cached: true,
    };
  }

  async getUsageStats(): Promise<{ today: number; week: number; month: number; cost: number }> {
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const stmt = this.db.prepare(`
      SELECT
        SUM(CASE WHEN date = ? THEN 1 ELSE 0 END) as today,
        SUM(CASE WHEN date >= ? THEN 1 ELSE 0 END) as week,
        SUM(CASE WHEN date >= ? THEN 1 ELSE 0 END) as month,
        SUM(cost_usd) as cost
      FROM ai_usage
    `);

    const row = stmt.get(today, weekAgo, monthAgo) as { today: number; week: number; month: number; cost: number };
    return row;
  }
}
