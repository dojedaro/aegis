import { describe, expect, it } from "vitest";
import { evaluateCredential } from "../../src/services/credential-checks.js";

const base = { type: "IdentityCredential", issuer: "did:web:issuer.example", subject: "did:example:123", issued_at: "2026-01-01" };
const now = new Date("2026-06-01T00:00:00Z");

describe("evaluateCredential", () => {
  it("never reports the signature or issuer trust as passed", () => {
    const { checks } = evaluateCredential(base, now);
    expect(checks.signature.passed).toBeNull();
    expect(checks.issuer.passed).toBeNull();
  });

  it("is valid when the checks that run pass", () => {
    expect(evaluateCredential({ ...base, expires_at: "2027-01-01" }, now).status).toBe("valid");
    expect(evaluateCredential(base, now).checks.expiry.message).toBe("No expiry date");
  });

  it("is expired on or after the expiry date", () => {
    const r = evaluateCredential({ ...base, expires_at: "2026-06-01T00:00:00Z" }, now);
    expect(r.status).toBe("expired");
    expect(r.checks.expiry.passed).toBe(false);
  });
});
