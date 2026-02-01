import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface RegulatoryCheckArgs {
  content: string;
  contentType: "code" | "config" | "document";
  frameworks?: string[];
}

interface Finding {
  id: string;
  framework: string;
  requirement: string;
  severity: string;
  status: "compliant" | "non_compliant" | "needs_review";
  details: string;
  remediation?: string;
}

interface RegulatoryCheckResult {
  timestamp: string;
  contentType: string;
  frameworksChecked: string[];
  overallStatus: "compliant" | "non_compliant" | "needs_review";
  findings: Finding[];
  summary: {
    total: number;
    compliant: number;
    nonCompliant: number;
    needsReview: number;
  };
}

export const regulatoryCheckSchema = {
  type: "object" as const,
  properties: {
    content: {
      type: "string",
      description: "The code, configuration, or document content to check for compliance",
    },
    contentType: {
      type: "string",
      enum: ["code", "config", "document"],
      description: "Type of content being checked",
    },
    frameworks: {
      type: "array",
      items: { type: "string" },
      description: "Specific regulatory frameworks to check against (e.g., ['gdpr', 'eidas2', 'aml']). If not specified, checks all.",
    },
  },
  required: ["content", "contentType"],
};

export async function regulatoryCheck(args: unknown): Promise<RegulatoryCheckResult> {
  const { content, contentType, frameworks } = args as RegulatoryCheckArgs;

  const regulationsPath = join(__dirname, "../../data/regulations.json");
  const regulations = JSON.parse(readFileSync(regulationsPath, "utf-8"));

  const frameworksToCheck = frameworks || Object.keys(regulations.frameworks);
  const findings: Finding[] = [];

  // Content analysis patterns
  const contentLower = content.toLowerCase();

  for (const frameworkId of frameworksToCheck) {
    const framework = regulations.frameworks[frameworkId];
    if (!framework) continue;

    for (const req of framework.requirements) {
      const finding = analyzeRequirement(content, contentLower, contentType, frameworkId, framework.name, req);
      findings.push(finding);
    }
  }

  // Calculate summary
  const summary = {
    total: findings.length,
    compliant: findings.filter((f) => f.status === "compliant").length,
    nonCompliant: findings.filter((f) => f.status === "non_compliant").length,
    needsReview: findings.filter((f) => f.status === "needs_review").length,
  };

  // Determine overall status
  let overallStatus: "compliant" | "non_compliant" | "needs_review" = "compliant";
  if (summary.nonCompliant > 0) {
    overallStatus = "non_compliant";
  } else if (summary.needsReview > 0) {
    overallStatus = "needs_review";
  }

  return {
    timestamp: new Date().toISOString(),
    contentType,
    frameworksChecked: frameworksToCheck,
    overallStatus,
    findings,
    summary,
  };
}

function analyzeRequirement(
  content: string,
  contentLower: string,
  contentType: string,
  frameworkId: string,
  frameworkName: string,
  req: { id: string; category: string; requirement: string; description: string; severity: string; controls: string[] }
): Finding {
  // Compliance check heuristics based on content analysis
  const checks: Record<string, () => { status: "compliant" | "non_compliant" | "needs_review"; details: string; remediation?: string }> = {
    // GDPR checks
    "GDPR-001": () => {
      if (contentLower.includes("consent") && (contentLower.includes("checkbox") || contentLower.includes("agreement"))) {
        return { status: "compliant", details: "Consent mechanism detected in content" };
      }
      if (contentType === "code" && contentLower.includes("personal") && !contentLower.includes("consent")) {
        return {
          status: "non_compliant",
          details: "Personal data processing detected without consent mechanism",
          remediation: "Add consent collection and validation before processing personal data",
        };
      }
      return { status: "needs_review", details: "Unable to determine consent mechanism - manual review required" };
    },
    "GDPR-002": () => {
      const collectsData = contentLower.includes("collect") || contentLower.includes("gather") || contentLower.includes("store");
      if (collectsData && contentLower.includes("only") && contentLower.includes("necessary")) {
        return { status: "compliant", details: "Data minimization principle appears to be followed" };
      }
      if (collectsData && (contentLower.includes("all") || contentLower.includes("everything"))) {
        return {
          status: "non_compliant",
          details: "Appears to collect more data than necessary",
          remediation: "Review data collection to ensure only necessary data is collected",
        };
      }
      return { status: "needs_review", details: "Data collection scope unclear - review for minimization" };
    },
    "GDPR-004": () => {
      const hasEncryption = contentLower.includes("encrypt") || contentLower.includes("aes") || contentLower.includes("crypto");
      const hasAccessControl = contentLower.includes("auth") || contentLower.includes("permission") || contentLower.includes("role");
      if (hasEncryption && hasAccessControl) {
        return { status: "compliant", details: "Encryption and access control mechanisms detected" };
      }
      if (!hasEncryption && (contentLower.includes("password") || contentLower.includes("personal"))) {
        return {
          status: "non_compliant",
          details: "Sensitive data handling without encryption detected",
          remediation: "Implement encryption for sensitive data at rest and in transit",
        };
      }
      return { status: "needs_review", details: "Security measures require verification" };
    },

    // AML checks
    "AML-001": () => {
      const hasKyc = contentLower.includes("kyc") || contentLower.includes("identity") || contentLower.includes("verification");
      if (hasKyc) {
        return { status: "compliant", details: "Customer due diligence process detected" };
      }
      if (contentLower.includes("customer") || contentLower.includes("user") || contentLower.includes("account")) {
        return {
          status: "needs_review",
          details: "Customer handling detected - verify CDD is performed",
          remediation: "Ensure identity verification is performed before establishing business relationship",
        };
      }
      return { status: "compliant", details: "No customer processing detected requiring CDD" };
    },
    "AML-002": () => {
      const hasEdd = contentLower.includes("enhanced") || contentLower.includes("pep") || contentLower.includes("high-risk");
      if (hasEdd) {
        return { status: "compliant", details: "Enhanced due diligence considerations found" };
      }
      return { status: "needs_review", details: "Verify EDD process for high-risk scenarios" };
    },
    "AML-004": () => {
      const hasSanctions = contentLower.includes("sanctions") || contentLower.includes("ofac") || contentLower.includes("screening");
      if (hasSanctions) {
        return { status: "compliant", details: "Sanctions screening mechanism detected" };
      }
      if (contentLower.includes("customer") || contentLower.includes("transaction")) {
        return {
          status: "needs_review",
          details: "Customer/transaction processing without clear sanctions screening",
          remediation: "Implement sanctions list screening for all customers and transactions",
        };
      }
      return { status: "compliant", details: "No processing requiring sanctions screening detected" };
    },

    // eIDAS checks
    "EIDAS-001": () => {
      const hasIdentity = contentLower.includes("identity") || contentLower.includes("biometric") || contentLower.includes("liveness");
      if (hasIdentity && contentLower.includes("verification")) {
        return { status: "compliant", details: "High-assurance identity verification patterns detected" };
      }
      return { status: "needs_review", details: "Verify identity proofing meets high LoA requirements" };
    },
    "EIDAS-002": () => {
      const hasVC = contentLower.includes("verifiable") || contentLower.includes("credential") || contentLower.includes("wallet");
      if (hasVC) {
        return { status: "compliant", details: "Verifiable credential support detected" };
      }
      return { status: "needs_review", details: "Verify EUDIW compatibility if applicable" };
    },
  };

  // Run specific check if available, otherwise use default analysis
  if (checks[req.id]) {
    const result = checks[req.id]();
    return {
      id: req.id,
      framework: frameworkName,
      requirement: req.requirement,
      severity: req.severity,
      ...result,
    };
  }

  // Default: mark as needs review
  return {
    id: req.id,
    framework: frameworkName,
    requirement: req.requirement,
    severity: req.severity,
    status: "needs_review",
    details: `Automated check not available for this requirement - manual review recommended`,
  };
}
