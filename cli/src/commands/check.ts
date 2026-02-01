import { readFileSync, existsSync, statSync, readdirSync } from "fs";
import { join, extname } from "path";
import ora from "ora";
import * as display from "../utils/display.js";

interface Finding {
  id: string;
  framework: string;
  requirement: string;
  severity: string;
  status: string;
  details: string;
  remediation?: string;
}

interface PIIMatch {
  type: string;
  severity: string;
  redactedValue: string;
}

interface CheckOptions {
  frameworks: string;
  output: string;
}

// Simplified compliance checking logic (mirrors MCP server)
function checkContent(content: string, frameworks: string[]): Finding[] {
  const findings: Finding[] = [];
  const contentLower = content.toLowerCase();

  // GDPR checks
  if (frameworks.includes("gdpr")) {
    // Consent check
    if (contentLower.includes("personal") && !contentLower.includes("consent")) {
      findings.push({
        id: "GDPR-001",
        framework: "GDPR",
        requirement: "Valid legal basis for processing",
        severity: "critical",
        status: "needs_review",
        details: "Personal data processing detected - verify consent mechanism exists",
        remediation: "Implement consent collection before processing personal data",
      });
    }

    // Encryption check
    if (
      (contentLower.includes("password") || contentLower.includes("personal")) &&
      !contentLower.includes("encrypt") &&
      !contentLower.includes("hash")
    ) {
      findings.push({
        id: "GDPR-004",
        framework: "GDPR",
        requirement: "Appropriate security measures",
        severity: "high",
        status: "non_compliant",
        details: "Sensitive data handling without apparent encryption",
        remediation: "Implement encryption for sensitive data at rest and in transit",
      });
    }
  }

  // AML checks
  if (frameworks.includes("aml")) {
    if (
      (contentLower.includes("customer") || contentLower.includes("user")) &&
      !contentLower.includes("verify") &&
      !contentLower.includes("kyc")
    ) {
      findings.push({
        id: "AML-001",
        framework: "AML/KYC",
        requirement: "Customer Due Diligence",
        severity: "high",
        status: "needs_review",
        details: "Customer handling without apparent identity verification",
        remediation: "Implement identity verification before establishing relationship",
      });
    }
  }

  // eIDAS checks
  if (frameworks.includes("eidas2")) {
    if (contentLower.includes("identity") && !contentLower.includes("verification")) {
      findings.push({
        id: "EIDAS-001",
        framework: "eIDAS 2.0",
        requirement: "High assurance identity verification",
        severity: "high",
        status: "needs_review",
        details: "Identity handling without high-assurance verification",
        remediation: "Implement qualified identity verification process",
      });
    }
  }

  return findings;
}

// Simplified PII detection
function detectPII(content: string): PIIMatch[] {
  const matches: PIIMatch[] = [];
  const patterns = [
    { type: "SSN", pattern: /\b\d{3}-\d{2}-\d{4}\b/g, severity: "critical" },
    { type: "Email", pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, severity: "high" },
    { type: "Credit Card", pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/g, severity: "critical" },
    { type: "Phone", pattern: /\b(?:\+?1[-.\s]?)?(?:\([0-9]{3}\)[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}\b/g, severity: "medium" },
  ];

  for (const p of patterns) {
    p.pattern.lastIndex = 0;
    let match;
    while ((match = p.pattern.exec(content)) !== null) {
      // Skip obvious test data
      if (match[0].includes("000-00-0000") || match[0].includes("example")) continue;
      matches.push({
        type: p.type,
        severity: p.severity,
        redactedValue: match[0].substring(0, 3) + "***" + match[0].substring(match[0].length - 2),
      });
    }
  }

  return matches;
}

function getFilesToCheck(target: string): string[] {
  if (!existsSync(target)) {
    return [];
  }

  const stat = statSync(target);
  if (stat.isFile()) {
    return [target];
  }

  if (stat.isDirectory()) {
    const files: string[] = [];
    const entries = readdirSync(target, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if ([".ts", ".js", ".json", ".yaml", ".yml", ".md", ".txt"].includes(ext)) {
          files.push(join(target, entry.name));
        }
      }
    }
    return files;
  }

  return [];
}

export async function checkCommand(target: string, options: CheckOptions): Promise<void> {
  display.banner();
  display.header("Compliance Check");

  const frameworks = options.frameworks.split(",").map((f) => f.trim().toLowerCase());
  display.info(`Frameworks: ${frameworks.join(", ").toUpperCase()}`);
  display.info(`Target: ${target}`);
  console.log();

  const spinner = ora("Scanning files...").start();

  const files = getFilesToCheck(target);

  if (files.length === 0) {
    spinner.fail("No files found to check");
    return;
  }

  spinner.text = `Found ${files.length} file(s) to analyze`;

  const allFindings: Finding[] = [];
  const allPII: PIIMatch[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf-8");
      const findings = checkContent(content, frameworks);
      const pii = detectPII(content);

      for (const f of findings) {
        allFindings.push({ ...f, details: `${f.details} [${file}]` });
      }
      allPII.push(...pii);
    } catch {
      // Skip files that can't be read
    }
  }

  spinner.succeed(`Analyzed ${files.length} file(s)`);
  console.log();

  // PII Results
  if (allPII.length > 0) {
    display.subheader("PII Detection");
    display.warning(`Found ${allPII.length} potential PII item(s)`);

    const piiTable = display.createTable(["Type", "Severity", "Value"]);
    for (const p of allPII.slice(0, 10)) {
      piiTable.push([p.type, display.severity(p.severity), p.redactedValue]);
    }
    console.log(piiTable.toString());

    if (allPII.length > 10) {
      display.info(`... and ${allPII.length - 10} more`);
    }
  } else {
    display.subheader("PII Detection");
    display.success("No PII detected");
  }

  // Compliance Findings
  display.subheader("Compliance Findings");

  if (allFindings.length === 0) {
    display.success("No compliance issues found");
  } else {
    const critical = allFindings.filter((f) => f.severity === "critical").length;
    const high = allFindings.filter((f) => f.severity === "high").length;
    const medium = allFindings.filter((f) => f.severity === "medium").length;

    display.warning(`Found ${allFindings.length} finding(s)`);
    console.log();

    display.keyValue("Critical:", String(critical));
    display.keyValue("High:", String(high));
    display.keyValue("Medium:", String(medium));
    console.log();

    const findingsTable = display.createTable(["ID", "Framework", "Severity", "Status", "Requirement"]);
    for (const f of allFindings) {
      findingsTable.push([
        f.id,
        f.framework,
        display.severity(f.severity),
        display.complianceStatus(f.status),
        f.requirement.substring(0, 30) + (f.requirement.length > 30 ? "..." : ""),
      ]);
    }
    console.log(findingsTable.toString());
  }

  // Summary
  display.subheader("Summary");

  const overallStatus =
    allFindings.some((f) => f.status === "non_compliant")
      ? "non_compliant"
      : allFindings.length > 0
        ? "needs_review"
        : "compliant";

  display.box(
    [
      `Files Checked:    ${files.length}`,
      `PII Items:        ${allPII.length}`,
      `Findings:         ${allFindings.length}`,
      `Overall Status:   ${display.complianceStatus(overallStatus)}`,
    ],
    "Compliance Check Complete"
  );

  if (allFindings.length > 0) {
    console.log();
    display.info("Run '/compliance-check' skill for detailed remediation guidance");
  }
}
