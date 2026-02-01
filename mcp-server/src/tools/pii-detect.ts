import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface PIIMatch {
  type: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  value: string;
  redactedValue: string;
  location: {
    start: number;
    end: number;
    line?: number;
    column?: number;
  };
}

interface PIIDetectArgs {
  content: string;
  contentType?: "code" | "text" | "config" | "log";
  includeLineNumbers?: boolean;
  redactMatches?: boolean;
}

interface PIIDetectResult {
  hasPII: boolean;
  timestamp: string;
  contentType: string;
  totalMatches: number;
  matchesBySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  matches: PIIMatch[];
  redactedContent?: string;
  recommendations: string[];
}

export const piiDetectSchema = {
  type: "object" as const,
  properties: {
    content: {
      type: "string",
      description: "The text or code content to scan for PII",
    },
    contentType: {
      type: "string",
      enum: ["code", "text", "config", "log"],
      description: "Type of content being scanned (affects pattern matching)",
    },
    includeLineNumbers: {
      type: "boolean",
      description: "Include line and column numbers in match locations",
    },
    redactMatches: {
      type: "boolean",
      description: "Return redacted version of content with PII masked",
    },
  },
  required: ["content"],
};

// PII patterns with their metadata
const PII_PATTERNS: Array<{
  type: string;
  pattern: RegExp;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  redactChar: string;
}> = [
  {
    type: "ssn",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    description: "US Social Security Number",
    severity: "critical",
    redactChar: "X",
  },
  {
    type: "creditCard",
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    description: "Credit Card Number",
    severity: "critical",
    redactChar: "X",
  },
  {
    type: "email",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    description: "Email Address",
    severity: "high",
    redactChar: "*",
  },
  {
    type: "phone",
    pattern: /\b(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    description: "Phone Number",
    severity: "medium",
    redactChar: "#",
  },
  {
    type: "passport",
    pattern: /\b[A-Z]{1,2}[0-9]{6,9}\b/g,
    description: "Passport Number",
    severity: "critical",
    redactChar: "X",
  },
  {
    type: "iban",
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
    description: "International Bank Account Number",
    severity: "critical",
    redactChar: "X",
  },
  {
    type: "ipAddress",
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    description: "IP Address",
    severity: "medium",
    redactChar: "#",
  },
  {
    type: "dateOfBirth",
    pattern: /\b(?:DOB|Date of Birth|Birth Date|born)[\s:]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/gi,
    description: "Date of Birth",
    severity: "high",
    redactChar: "*",
  },
  {
    type: "driversLicense",
    pattern: /\b(?:DL|Driver'?s? License|License #?)[\s:]*[A-Z0-9]{5,15}\b/gi,
    description: "Driver's License Number",
    severity: "critical",
    redactChar: "X",
  },
  {
    type: "apiKey",
    pattern: /\b(?:api[_-]?key|apikey|api[_-]?secret|secret[_-]?key)[\s:='"]*[A-Za-z0-9_\-]{20,}\b/gi,
    description: "API Key or Secret",
    severity: "critical",
    redactChar: "X",
  },
  {
    type: "password",
    pattern: /\b(?:password|passwd|pwd)[\s:='"]+\S{4,}\b/gi,
    description: "Password in Plain Text",
    severity: "critical",
    redactChar: "X",
  },
];

function getLineAndColumn(content: string, position: number): { line: number; column: number } {
  const lines = content.substring(0, position).split("\n");
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function redactValue(value: string, char: string): string {
  // Keep first and last characters for context, redact middle
  if (value.length <= 4) {
    return char.repeat(value.length);
  }
  const keepChars = Math.min(2, Math.floor(value.length / 4));
  return value.substring(0, keepChars) + char.repeat(value.length - keepChars * 2) + value.substring(value.length - keepChars);
}

export async function piiDetect(args: unknown): Promise<PIIDetectResult> {
  const { content, contentType = "text", includeLineNumbers = true, redactMatches = false } = args as PIIDetectArgs;

  const matches: PIIMatch[] = [];
  let redactedContent = content;

  // Scan for each PII pattern
  for (const piiType of PII_PATTERNS) {
    // Reset regex state
    piiType.pattern.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = piiType.pattern.exec(content)) !== null) {
      const value = match[0];
      const start = match.index;
      const end = start + value.length;

      const piiMatch: PIIMatch = {
        type: piiType.type,
        description: piiType.description,
        severity: piiType.severity,
        value: value,
        redactedValue: redactValue(value, piiType.redactChar),
        location: {
          start,
          end,
          ...(includeLineNumbers ? getLineAndColumn(content, start) : {}),
        },
      };

      matches.push(piiMatch);
    }
  }

  // Sort matches by position (for proper redaction)
  matches.sort((a, b) => b.location.start - a.location.start);

  // Redact if requested
  if (redactMatches) {
    for (const match of matches) {
      redactedContent =
        redactedContent.substring(0, match.location.start) +
        match.redactedValue +
        redactedContent.substring(match.location.end);
    }
  }

  // Re-sort by position ascending for output
  matches.sort((a, b) => a.location.start - b.location.start);

  // Count by severity
  const matchesBySeverity = {
    critical: matches.filter((m) => m.severity === "critical").length,
    high: matches.filter((m) => m.severity === "high").length,
    medium: matches.filter((m) => m.severity === "medium").length,
    low: matches.filter((m) => m.severity === "low").length,
  };

  // Generate recommendations
  const recommendations: string[] = [];
  if (matchesBySeverity.critical > 0) {
    recommendations.push("CRITICAL: Remove or encrypt all critical PII before storing or transmitting");
    recommendations.push("Use tokenization or data masking for sensitive identifiers");
  }
  if (matchesBySeverity.high > 0) {
    recommendations.push("HIGH: Consider pseudonymization for personal contact information");
    recommendations.push("Implement access controls for data containing personal information");
  }
  if (contentType === "code" || contentType === "config") {
    recommendations.push("Never hardcode sensitive data in source code or configuration files");
    recommendations.push("Use environment variables or secret management services");
  }
  if (contentType === "log") {
    recommendations.push("Configure log redaction to automatically mask PII patterns");
    recommendations.push("Review log retention policies for GDPR compliance");
  }
  if (matches.length > 0) {
    recommendations.push("Conduct a Data Protection Impact Assessment (DPIA) for processing this data");
  }

  return {
    hasPII: matches.length > 0,
    timestamp: new Date().toISOString(),
    contentType,
    totalMatches: matches.length,
    matchesBySeverity,
    matches,
    ...(redactMatches ? { redactedContent } : {}),
    recommendations,
  };
}
