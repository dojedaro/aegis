import ora from "ora";
import * as display from "../utils/display.js";

interface RiskFactor {
  name: string;
  category: string;
  likelihood: number;
  impact: number;
  description: string;
  mitigations: string[];
}

interface RiskOptions {
  type: string;
  jurisdiction: string;
}

// Sample risk factors for demonstration
function generateRiskFactors(entityType: string, entityId: string, jurisdiction: string): RiskFactor[] {
  const factors: RiskFactor[] = [];

  // Base factors by entity type
  if (entityType === "customer") {
    factors.push({
      name: "Identity Verification Completeness",
      category: "compliance",
      likelihood: 3,
      impact: 4,
      description: "Customer identity documents may require additional verification",
      mitigations: ["Request additional ID documents", "Perform biometric verification", "Cross-reference with trusted sources"],
    });

    factors.push({
      name: "Transaction Pattern Risk",
      category: "financial",
      likelihood: 2,
      impact: 3,
      description: "Transaction patterns require monitoring for unusual activity",
      mitigations: ["Implement transaction monitoring", "Set velocity limits", "Enable real-time alerts"],
    });

    if (jurisdiction === "EU") {
      factors.push({
        name: "Cross-Border Data Transfer",
        category: "compliance",
        likelihood: 4,
        impact: 4,
        description: "EU data protection requirements for cross-border transfers",
        mitigations: ["Implement Standard Contractual Clauses", "Use EU-based processing", "Conduct Transfer Impact Assessment"],
      });
    }

    factors.push({
      name: "PEP/Sanctions Exposure",
      category: "compliance",
      likelihood: 2,
      impact: 5,
      description: "Potential exposure to politically exposed persons or sanctioned entities",
      mitigations: ["Regular PEP screening", "Sanctions list monitoring", "Enhanced due diligence process"],
    });
  } else if (entityType === "transaction") {
    factors.push({
      name: "Transaction Amount",
      category: "financial",
      likelihood: 3,
      impact: 4,
      description: "Transaction value triggers enhanced review thresholds",
      mitigations: ["Apply transaction limits", "Require additional authorization", "Document business rationale"],
    });

    factors.push({
      name: "Geographic Risk",
      category: "compliance",
      likelihood: 3,
      impact: 4,
      description: "Transaction involves high-risk jurisdictions",
      mitigations: ["Enhanced monitoring", "Source of funds verification", "Correspondent bank due diligence"],
    });
  } else if (entityType === "process") {
    factors.push({
      name: "Manual Intervention Points",
      category: "operational",
      likelihood: 4,
      impact: 3,
      description: "Process relies on manual steps prone to human error",
      mitigations: ["Automate key steps", "Implement validation checks", "Add supervisory review"],
    });

    factors.push({
      name: "Audit Trail Completeness",
      category: "compliance",
      likelihood: 2,
      impact: 4,
      description: "Process may not capture all required audit information",
      mitigations: ["Review logging requirements", "Implement structured logging", "Regular audit trail testing"],
    });
  } else if (entityType === "system") {
    factors.push({
      name: "Data Security Controls",
      category: "compliance",
      likelihood: 2,
      impact: 5,
      description: "System stores sensitive data requiring protection",
      mitigations: ["Encryption at rest and transit", "Access control review", "Regular security assessments"],
    });

    factors.push({
      name: "Availability Risk",
      category: "operational",
      likelihood: 3,
      impact: 4,
      description: "System availability impacts business continuity",
      mitigations: ["Implement redundancy", "Define RTO/RPO", "Regular failover testing"],
    });
  }

  return factors;
}

function calculateRiskLevel(score: number): string {
  if (score <= 4) return "low";
  if (score <= 9) return "medium";
  if (score <= 16) return "high";
  return "critical";
}

export async function riskCommand(entity: string, options: RiskOptions): Promise<void> {
  display.banner();
  display.header("Risk Assessment");

  display.info(`Entity: ${entity}`);
  display.info(`Type: ${options.type}`);
  display.info(`Jurisdiction: ${options.jurisdiction}`);
  console.log();

  const spinner = ora("Analyzing risk factors...").start();

  // Simulate analysis
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const factors = generateRiskFactors(options.type, entity, options.jurisdiction);

  spinner.succeed(`Identified ${factors.length} risk factors`);
  console.log();

  // Calculate scores
  const scoredFactors = factors.map((f) => ({
    ...f,
    score: f.likelihood * f.impact,
    level: calculateRiskLevel(f.likelihood * f.impact),
  }));

  // Sort by score descending
  scoredFactors.sort((a, b) => b.score - a.score);

  // Calculate overall score
  const totalScore = scoredFactors.reduce((sum, f) => sum + f.score, 0);
  const avgScore = Math.round(totalScore / scoredFactors.length);
  const maxScore = Math.max(...scoredFactors.map((f) => f.score));
  const overallScore = Math.round(avgScore * 0.6 + maxScore * 0.4);
  const overallLevel = calculateRiskLevel(overallScore);

  // Display risk matrix
  display.riskMatrix();

  // Overall score box
  display.box(
    [
      `Entity:          ${entity}`,
      `Type:            ${options.type}`,
      `Factors:         ${factors.length}`,
      `Overall Score:   ${overallScore}/25`,
      `Risk Level:      ${display.riskLevel(overallLevel)}`,
    ],
    "Risk Assessment Summary"
  );

  // Detailed factors
  display.subheader("Risk Factors");

  const factorTable = display.createTable(["Factor", "Category", "L", "I", "Score", "Level"]);

  for (const f of scoredFactors) {
    factorTable.push([
      f.name.substring(0, 30) + (f.name.length > 30 ? "..." : ""),
      f.category,
      String(f.likelihood),
      String(f.impact),
      String(f.score),
      display.riskLevel(f.level),
    ]);
  }

  console.log(factorTable.toString());

  // Category breakdown
  display.subheader("Category Analysis");

  const categories = [...new Set(scoredFactors.map((f) => f.category))];
  for (const cat of categories) {
    const catFactors = scoredFactors.filter((f) => f.category === cat);
    const catAvg = Math.round(catFactors.reduce((s, f) => s + f.score, 0) / catFactors.length);
    const catLevel = calculateRiskLevel(catAvg);

    console.log(`  ${display.colors.primary(cat.toUpperCase().padEnd(15))} ${display.riskLevel(catLevel)} (avg: ${catAvg})`);
    for (const f of catFactors) {
      console.log(`    ${display.icons.bullet} ${f.name}`);
    }
    console.log();
  }

  // Top recommendations
  display.subheader("Priority Recommendations");

  const highRisk = scoredFactors.filter((f) => f.score >= 10);
  if (highRisk.length === 0) {
    display.success("No high-risk factors requiring immediate attention");
  } else {
    let priority = 1;
    for (const f of highRisk.slice(0, 3)) {
      console.log(`  ${display.colors.warning(`${priority}.`)} ${display.colors.primary(f.name)}`);
      console.log(`     ${display.colors.muted(f.description)}`);
      if (f.mitigations.length > 0) {
        console.log(`     ${display.icons.arrow} ${f.mitigations[0]}`);
      }
      console.log();
      priority++;
    }
  }

  // Regulatory implications
  display.subheader("Regulatory Implications");

  if (overallLevel === "critical" || overallLevel === "high") {
    display.warning("Enhanced compliance measures required:");
    display.bullet("AML: Apply Enhanced Due Diligence (EDD) procedures");
    display.bullet("GDPR: Consider Data Protection Impact Assessment");
    display.bullet("eIDAS: High-assurance identity verification required");
  } else if (overallLevel === "medium") {
    display.info("Standard compliance measures apply:");
    display.bullet("Periodic review cycle: Quarterly");
    display.bullet("Standard monitoring procedures");
  } else {
    display.success("Standard compliance procedures sufficient");
    display.bullet("Periodic review cycle: Annual");
  }

  console.log();
  display.info("Run '/risk-assess' skill for comprehensive risk documentation");
}
