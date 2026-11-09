import type { BetaMessageParam, BetaTool, BetaToolResultBlockParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import { ARTICLES } from "../data/regulations.js";
import { LLMClient, textOf } from "./llm.js";
import { scanPII } from "./pii-scanner.js";
import type { RAGService } from "./rag.js";

/**
 * Agentic compliance review.
 *
 * Claude drives a tool loop, but every tool does real, deterministic work:
 *   - search_regulations: BM25 retrieval over the curated article library (grounding)
 *   - scan_pii:          rule-based PII detection on an excerpt (evidence)
 *   - record_finding:    validated finding; the cited article must exist (no invented citations)
 * The score is computed in code from finding severities, not by the model.
 */

export type Severity = "low" | "medium" | "high" | "critical";

export interface Finding {
  id: string;
  severity: Severity;
  regulation: string;
  article_id: string;
  description: string;
  recommendation: string;
}

export interface ComplianceAgentResult {
  analysis: string;
  findings: Finding[];
  score: number;
  actions_taken: string[];
  mode: "agentic" | "demo";
}

export interface RiskAgentResult {
  entity: string;
  risk_level: Severity;
  score: number;
  factors: Array<{ name: string; score: number; rationale: string }>;
  recommendations: string[];
  mode: "agentic" | "demo";
}

export const SEVERITY_PENALTY: Record<Severity, number> = { low: 3, medium: 8, high: 15, critical: 25 };
export const MAX_AGENT_TURNS = 8;
const MAX_CONTENT_CHARS = 8000;

export function scoreFindings(findings: Pick<Finding, "severity">[]): number {
  return Math.max(0, 100 - findings.reduce((sum, f) => sum + SEVERITY_PENALTY[f.severity], 0));
}

const ARTICLE_IDS = new Set(ARTICLES.map((a) => a.id));

const TOOLS: BetaTool[] = [
  {
    name: "search_regulations",
    description:
      "Search the regulation library (GDPR, eIDAS 2.0, AML/6AMLD, EU AI Act). Returns article ids, titles and summaries. " +
      "Use it to find the exact article a requirement comes from before recording a finding.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to look for, e.g. 'retention period for KYC records'" },
      },
      required: ["query"],
    },
  },
  {
    name: "scan_pii",
    description: "Run the deterministic PII scanner on an excerpt of the content. Returns PII types, counts and masked samples.",
    input_schema: {
      type: "object",
      properties: { excerpt: { type: "string", description: "Text copied from the content under review" } },
      required: ["excerpt"],
    },
  },
  {
    name: "record_finding",
    description:
      "Record one compliance issue found in the content. article_id must be an id returned by search_regulations. " +
      "Only record issues supported by the content itself.",
    input_schema: {
      type: "object",
      properties: {
        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
        article_id: { type: "string", description: "e.g. gdpr-art-5" },
        description: { type: "string", description: "What is wrong, quoting the relevant part of the content" },
        recommendation: { type: "string", description: "Concrete fix" },
      },
      required: ["severity", "article_id", "description", "recommendation"],
    },
  },
];

const SEVERITIES = new Set<Severity>(["low", "medium", "high", "critical"]);

export class ComplianceAgentService {
  constructor(
    private readonly llm: LLMClient | null,
    private readonly rag: RAGService
  ) {}

  get enabled(): boolean {
    return this.llm !== null;
  }

  async analyzeCompliance(content: string, frameworks: string[], targetType: string): Promise<ComplianceAgentResult> {
    if (!this.llm) return demoComplianceResult(frameworks);

    const findings: Finding[] = [];
    const actions: string[] = [];
    let messages: BetaMessageParam[] = [
      {
        role: "user",
        content: `Review the following ${targetType} for compliance with: ${frameworks.join(", ")}.

Work method: search the regulation library for the requirements that apply, use scan_pii on any part that may contain personal data, and call record_finding for each real issue (citing the article id you found). When you are done, reply with a short summary and no further tool calls.

<content>
${content.slice(0, MAX_CONTENT_CHARS)}
</content>`,
      },
    ];

    for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
      const response = await this.llm.create({ messages, tools: TOOLS, effort: "medium" });

      if (response.stop_reason !== "tool_use") {
        return { analysis: textOf(response) || "Analysis complete", findings, score: scoreFindings(findings), actions_taken: actions, mode: "agentic" };
      }

      // Run every tool call from this turn, then return all results in one user message.
      const results: BetaToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const { content: result, isError } = this.runTool(block.name, block.input as Record<string, unknown>, findings, actions);
        results.push({ type: "tool_result", tool_use_id: block.id, content: result, ...(isError && { is_error: true }) });
      }
      // Pass the assistant turn back unchanged (it may include thinking blocks).
      messages = [...messages, { role: "assistant", content: response.content }, { role: "user", content: results }];
    }

    actions.push(`Stopped after ${MAX_AGENT_TURNS} turns`);
    return { analysis: "Analysis stopped at the turn limit; findings so far are listed.", findings, score: scoreFindings(findings), actions_taken: actions, mode: "agentic" };
  }

  /** Execute one tool call. Invalid input returns an error result so the model can correct itself. */
  runTool(
    name: string,
    input: Record<string, unknown>,
    findings: Finding[],
    actions: string[]
  ): { content: string; isError: boolean } {
    switch (name) {
      case "search_regulations": {
        const query = String(input.query ?? "");
        const hits = this.rag.search(query, 3).map(({ article }) => ({
          article_id: article.id,
          title: article.title,
          summary: article.summary,
          relevance: article.relevance,
        }));
        actions.push(`Searched regulations: "${query}" (${hits.length} hits)`);
        return { content: JSON.stringify(hits), isError: false };
      }
      case "scan_pii": {
        const pii = scanPII(String(input.excerpt ?? ""));
        actions.push(`Scanned excerpt for PII (${pii.length} types found)`);
        return { content: JSON.stringify(pii), isError: false };
      }
      case "record_finding": {
        const severity = input.severity as Severity;
        const articleId = String(input.article_id ?? "");
        if (!SEVERITIES.has(severity)) {
          return { content: `Invalid severity "${severity}"`, isError: true };
        }
        if (!ARTICLE_IDS.has(articleId)) {
          return { content: `Unknown article_id "${articleId}". Use search_regulations to find a valid id.`, isError: true };
        }
        const article = ARTICLES.find((a) => a.id === articleId)!;
        const finding: Finding = {
          id: `${article.framework.toUpperCase()}-${String(findings.length + 1).padStart(3, "0")}`,
          severity,
          regulation: article.title,
          article_id: articleId,
          description: String(input.description ?? ""),
          recommendation: String(input.recommendation ?? ""),
        };
        findings.push(finding);
        actions.push(`Recorded ${finding.id} (${severity}, ${articleId})`);
        return { content: JSON.stringify({ recorded: finding.id }), isError: false };
      }
      default:
        return { content: `Unknown tool "${name}"`, isError: true };
    }
  }

  async assessRisk(entity: string, entityType: string, context?: string): Promise<RiskAgentResult> {
    if (!this.llm) return demoRiskResult(entity);

    const result = await this.llm.json<Omit<RiskAgentResult, "entity" | "mode">>(
      "You are a KYC/AML risk analyst. Evaluate regulatory compliance, operational, reputational and financial crime risk. Scores are 0-100.",
      `Entity: ${entity}\nType: ${entityType}${context ? `\nContext: ${context}` : ""}`,
      RISK_SCHEMA
    );
    return { entity, ...result, mode: "agentic" };
  }
}

const RISK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["risk_level", "score", "factors", "recommendations"],
  properties: {
    risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
    score: { type: "integer" },
    factors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "score", "rationale"],
        properties: { name: { type: "string" }, score: { type: "integer" }, rationale: { type: "string" } },
      },
    },
    recommendations: { type: "array", items: { type: "string" } },
  },
};

function demoComplianceResult(frameworks: string[]): ComplianceAgentResult {
  const findings: Finding[] = frameworks.map((f, i) => ({
    id: `${f.toUpperCase()}-00${i + 1}`,
    severity: (["low", "medium", "high"] as const)[i % 3],
    regulation: f.toUpperCase(),
    article_id: "",
    description: `Sample finding for ${f} compliance review`,
    recommendation: `Review ${f} requirements and update implementation`,
  }));
  return {
    analysis: "Demo mode: set ANTHROPIC_API_KEY for a real agentic review. These findings are illustrative.",
    findings,
    score: scoreFindings(findings),
    actions_taken: ["Demo mode - no analysis performed"],
    mode: "demo",
  };
}

function demoRiskResult(entity: string): RiskAgentResult {
  return {
    entity,
    risk_level: "medium",
    score: 45,
    factors: [
      { name: "Regulatory Compliance", score: 35, rationale: "Demo assessment" },
      { name: "Operational Risk", score: 50, rationale: "Demo assessment" },
      { name: "Financial Crime", score: 45, rationale: "Demo assessment" },
    ],
    recommendations: ["Set ANTHROPIC_API_KEY for a real assessment"],
    mode: "demo",
  };
}
