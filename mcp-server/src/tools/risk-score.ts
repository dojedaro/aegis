import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface RiskFactor {
  name: string;
  category: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  description?: string;
  mitigations?: string[];
}

interface RiskScoreArgs {
  entityType: "customer" | "transaction" | "process" | "system";
  entityId: string;
  factors: RiskFactor[];
  context?: {
    jurisdiction?: string;
    industry?: string;
    previousIncidents?: number;
  };
}

interface RiskScoreResult {
  entityType: string;
  entityId: string;
  timestamp: string;
  overallScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: Array<RiskFactor & { score: number; level: string }>;
  aggregatedByCategory: Record<string, { avgScore: number; level: string; factors: string[] }>;
  recommendations: string[];
  regulatoryImplications: string[];
}

export const riskScoreSchema = {
  type: "object" as const,
  properties: {
    entityType: {
      type: "string",
      enum: ["customer", "transaction", "process", "system"],
      description: "Type of entity being assessed",
    },
    entityId: {
      type: "string",
      description: "Unique identifier for the entity",
    },
    factors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "Name of the risk factor" },
          category: { type: "string", description: "Category (e.g., 'compliance', 'operational', 'financial', 'reputational')" },
          likelihood: { type: "number", minimum: 1, maximum: 5, description: "Likelihood score (1=rare, 5=almost certain)" },
          impact: { type: "number", minimum: 1, maximum: 5, description: "Impact score (1=negligible, 5=catastrophic)" },
          description: { type: "string", description: "Description of the risk" },
          mitigations: { type: "array", items: { type: "string" }, description: "Potential mitigations" },
        },
        required: ["name", "category", "likelihood", "impact"],
      },
      description: "Risk factors to evaluate",
    },
    context: {
      type: "object",
      properties: {
        jurisdiction: { type: "string", description: "Regulatory jurisdiction" },
        industry: { type: "string", description: "Industry sector" },
        previousIncidents: { type: "number", description: "Number of previous incidents" },
      },
      description: "Additional context for risk assessment",
    },
  },
  required: ["entityType", "entityId", "factors"],
};

function calculateRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score <= 4) return "low";
  if (score <= 9) return "medium";
  if (score <= 16) return "high";
  return "critical";
}

function generateRecommendations(
  factors: Array<RiskFactor & { score: number; level: string }>,
  entityType: string
): string[] {
  const recommendations: string[] = [];
  const highRiskFactors = factors.filter((f) => f.score >= 10);

  for (const factor of highRiskFactors) {
    if (factor.mitigations && factor.mitigations.length > 0) {
      recommendations.push(`[${factor.category.toUpperCase()}] ${factor.name}: ${factor.mitigations[0]}`);
    } else {
      // Generate default recommendations based on category
      switch (factor.category.toLowerCase()) {
        case "compliance":
          recommendations.push(`[COMPLIANCE] ${factor.name}: Conduct detailed compliance review and implement controls`);
          break;
        case "operational":
          recommendations.push(`[OPERATIONAL] ${factor.name}: Review operational procedures and add monitoring`);
          break;
        case "financial":
          recommendations.push(`[FINANCIAL] ${factor.name}: Implement financial controls and transaction limits`);
          break;
        case "reputational":
          recommendations.push(`[REPUTATIONAL] ${factor.name}: Prepare communication plan and stakeholder management`);
          break;
        default:
          recommendations.push(`[${factor.category.toUpperCase()}] ${factor.name}: Implement risk mitigation measures`);
      }
    }
  }

  // Entity-specific recommendations
  if (entityType === "customer" && factors.some((f) => f.category === "compliance" && f.score >= 10)) {
    recommendations.push("Apply Enhanced Due Diligence (EDD) procedures for this customer");
  }
  if (entityType === "transaction" && factors.some((f) => f.score >= 15)) {
    recommendations.push("Flag transaction for manual review before processing");
  }

  return recommendations;
}

function getRegulatoryImplications(
  riskLevel: "low" | "medium" | "high" | "critical",
  entityType: string,
  jurisdiction?: string
): string[] {
  const implications: string[] = [];

  if (riskLevel === "critical" || riskLevel === "high") {
    implications.push("AML: Enhanced monitoring and potential SAR filing required");
    implications.push("GDPR: Data Protection Impact Assessment may be required");

    if (entityType === "customer") {
      implications.push("AML: Customer risk rating must be elevated");
      implications.push("KYC: Additional verification documentation required");
    }

    if (jurisdiction === "EU" || !jurisdiction) {
      implications.push("eIDAS: High-assurance identity verification required");
    }
  }

  if (riskLevel === "medium") {
    implications.push("Standard monitoring procedures apply");
    implications.push("Periodic review cycle: Quarterly");
  }

  if (riskLevel === "low") {
    implications.push("Standard compliance procedures sufficient");
    implications.push("Periodic review cycle: Annual");
  }

  return implications;
}

export async function riskScore(args: unknown): Promise<RiskScoreResult> {
  const { entityType, entityId, factors, context } = args as RiskScoreArgs;

  // Calculate individual factor scores
  const scoredFactors = factors.map((factor) => {
    const score = factor.likelihood * factor.impact;
    return {
      ...factor,
      score,
      level: calculateRiskLevel(score),
    };
  });

  // Calculate overall score (weighted average with max factor consideration)
  const totalScore = scoredFactors.reduce((sum, f) => sum + f.score, 0);
  const avgScore = totalScore / scoredFactors.length;
  const maxScore = Math.max(...scoredFactors.map((f) => f.score));

  // Overall score is weighted toward the maximum risk
  const overallScore = Math.round(avgScore * 0.6 + maxScore * 0.4);

  // Apply context multipliers
  let adjustedScore = overallScore;
  if (context?.previousIncidents && context.previousIncidents > 0) {
    adjustedScore = Math.min(25, adjustedScore + context.previousIncidents * 2);
  }

  const riskLevel = calculateRiskLevel(adjustedScore);

  // Aggregate by category
  const categories = [...new Set(scoredFactors.map((f) => f.category))];
  const aggregatedByCategory: Record<string, { avgScore: number; level: string; factors: string[] }> = {};

  for (const category of categories) {
    const categoryFactors = scoredFactors.filter((f) => f.category === category);
    const categoryAvg = categoryFactors.reduce((sum, f) => sum + f.score, 0) / categoryFactors.length;
    aggregatedByCategory[category] = {
      avgScore: Math.round(categoryAvg * 10) / 10,
      level: calculateRiskLevel(categoryAvg),
      factors: categoryFactors.map((f) => f.name),
    };
  }

  return {
    entityType,
    entityId,
    timestamp: new Date().toISOString(),
    overallScore: adjustedScore,
    riskLevel,
    factors: scoredFactors,
    aggregatedByCategory,
    recommendations: generateRecommendations(scoredFactors, entityType),
    regulatoryImplications: getRegulatoryImplications(riskLevel, entityType, context?.jurisdiction),
  };
}
