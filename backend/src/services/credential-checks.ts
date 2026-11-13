/**
 * Structural checks for a submitted verifiable credential.
 *
 * Pure function so it can be unit-tested without the HTTP layer. It reports only checks it actually
 * performs: `passed: null` means "not checked in this demo" (signature and issuer trust), never "passed".
 */

export interface CredentialInput {
  type: string;
  issuer: string;
  subject: string;
  issued_at: string;
  expires_at?: string;
}

export interface Check {
  passed: boolean | null;
  message: string;
}

export type CredentialStatus = "valid" | "expired" | "invalid";

export interface CredentialEvaluation {
  status: CredentialStatus;
  checks: Record<"format" | "issuer" | "signature" | "expiry", Check>;
}

export function evaluateCredential(data: CredentialInput, now: Date): CredentialEvaluation {
  const expired = data.expires_at !== undefined && new Date(data.expires_at) <= now;
  const checks: CredentialEvaluation["checks"] = {
    format: { passed: true, message: "Required fields present (type, issuer, subject, issue date)" },
    issuer: { passed: null, message: `Issuer ${data.issuer} recorded; trust not checked (no trust registry in this demo)` },
    signature: { passed: null, message: "Not checked: cryptographic signature verification is not implemented in this demo" },
    expiry: {
      passed: !expired,
      message: data.expires_at ? (expired ? "Credential has expired" : `Valid until ${data.expires_at}`) : "No expiry date",
    },
  };
  // Status reflects only the checks that ran; an unverified signature is reported, not assumed.
  const failed = Object.values(checks).some((c) => c.passed === false);
  return { status: expired ? "expired" : failed ? "invalid" : "valid", checks };
}
