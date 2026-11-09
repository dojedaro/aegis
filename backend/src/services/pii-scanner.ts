/** Deterministic, rule-based PII detection shared by the PII API and the compliance agent. */

export type PIIType =
  | "email"
  | "phone"
  | "ssn"
  | "credit_card"
  | "ip_address"
  | "api_key"
  | "passport"
  | "iban";

export interface PIIFinding {
  type: PIIType;
  count: number;
  risk: "medium" | "high";
  /** Masked samples only; raw values never leave this module. */
  samples: string[];
}

const PII_PATTERNS: Record<PIIType, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
  credit_card: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ip_address: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  api_key: /\b(sk|pk|api|key|token|secret|password)[-_]?[a-zA-Z0-9]{16,}\b/gi,
  passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
  iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
};

const HIGH_RISK: ReadonlySet<PIIType> = new Set(["ssn", "credit_card", "api_key", "passport"]);

export function scanPII(content: string): PIIFinding[] {
  const findings: PIIFinding[] = [];
  for (const [type, pattern] of Object.entries(PII_PATTERNS) as [PIIType, RegExp][]) {
    const matches = content.match(pattern);
    if (matches?.length) {
      findings.push({
        type,
        count: matches.length,
        risk: HIGH_RISK.has(type) ? "high" : "medium",
        samples: matches.slice(0, 3).map((m) => maskPII(m, type)),
      });
    }
  }
  return findings;
}

export function redactPII(content: string): { redacted: string; redactions: { type: PIIType; count: number }[] } {
  let redacted = content;
  const redactions: { type: PIIType; count: number }[] = [];
  for (const [type, pattern] of Object.entries(PII_PATTERNS) as [PIIType, RegExp][]) {
    const matches = redacted.match(pattern);
    if (matches?.length) {
      redactions.push({ type, count: matches.length });
      redacted = redacted.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
    }
  }
  return { redacted, redactions };
}

export function maskPII(value: string, type: PIIType): string {
  if (type === "email") {
    const [local, domain] = value.split("@");
    return `${local[0]}***@${domain}`;
  }
  if (type === "phone" || type === "ssn" || type === "credit_card") {
    return value.slice(0, 2) + "*".repeat(Math.max(value.length - 4, 0)) + value.slice(-2);
  }
  if (type === "api_key") {
    return value.slice(0, 4) + "..." + value.slice(-4);
  }
  return value.slice(0, 2) + "***" + value.slice(-2);
}
