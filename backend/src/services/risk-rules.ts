/**
 * Deterministic, explainable KYC/AML risk scoring used when AI is unavailable.
 *
 * Each factor scores 1 (low) to 5 (high) from documented input fields; the sum maps to a
 * risk level. A sanctions hit always yields "critical". Same input -> same output, which
 * is what an auditor needs to reproduce a decision.
 */

export interface RiskInput {
  high_risk_jurisdiction?: boolean;
  pep?: boolean;
  sanctions_hit?: boolean;
  adverse_media?: boolean;
  relationship_years?: number;
}

export interface RiskFactor {
  name: string;
  score: number;
  reason: string;
}

export interface RuleBasedRisk {
  score: number;
  level: "low" | "medium" | "high" | "critical";
  factors: RiskFactor[];
  recommendations: string[];
}

const RECOMMENDATIONS: Record<RuleBasedRisk["level"], string[]> = {
  low: ["Standard monitoring", "Annual review"],
  medium: ["Enhanced monitoring", "Quarterly review"],
  high: ["Enhanced Due Diligence required", "Monthly review", "Senior approval needed"],
  critical: ["Do not onboard or transact pending review", "Escalate to MLRO", "File SAR if applicable"],
};

export function assessRiskByRules(entityType: string, input: RiskInput = {}): RuleBasedRisk {
  const years = input.relationship_years;
  const factors: RiskFactor[] = [
    input.high_risk_jurisdiction
      ? { name: "Geographic Risk", score: 5, reason: "High-risk jurisdiction" }
      : { name: "Geographic Risk", score: 1, reason: "No high-risk jurisdiction reported" },
    input.sanctions_hit
      ? { name: "Sanctions Screening", score: 5, reason: "Sanctions list match" }
      : { name: "Sanctions Screening", score: 1, reason: "No sanctions match reported" },
    input.adverse_media
      ? { name: "Adverse Media", score: 3, reason: "Adverse media reported" }
      : { name: "Adverse Media", score: 1, reason: "No adverse media reported" },
    years === undefined
      ? { name: "Relationship Duration", score: 3, reason: "Unknown relationship duration" }
      : years >= 3
        ? { name: "Relationship Duration", score: 1, reason: `${years}-year relationship` }
        : { name: "Relationship Duration", score: years >= 1 ? 2 : 3, reason: `${years}-year relationship` },
  ];
  if (entityType === "customer") {
    factors.push(
      input.pep
        ? { name: "PEP Exposure", score: 4, reason: "Politically exposed person (AMLD Art. 20)" }
        : { name: "PEP Exposure", score: 1, reason: "No PEP status reported" }
    );
  }

  const score = factors.reduce((sum, f) => sum + f.score, 0);
  const maxScore = factors.length * 5;
  const ratio = score / maxScore;
  const level: RuleBasedRisk["level"] = input.sanctions_hit
    ? "critical"
    : ratio <= 0.35
      ? "low"
      : ratio <= 0.55
        ? "medium"
        : ratio <= 0.75
          ? "high"
          : "critical";

  return { score, level, factors, recommendations: RECOMMENDATIONS[level] };
}
