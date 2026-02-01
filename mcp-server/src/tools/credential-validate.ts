interface VerifiableCredential {
  "@context": string[];
  type: string[];
  issuer: string | { id: string; name?: string };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id?: string;
    [key: string]: unknown;
  };
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue?: string;
    jws?: string;
  };
}

interface CredentialValidateArgs {
  credential: VerifiableCredential;
  options?: {
    checkExpiry?: boolean;
    verifySignature?: boolean;
    checkIssuerTrust?: boolean;
    requiredTypes?: string[];
  };
}

interface ValidationResult {
  isValid: boolean;
  timestamp: string;
  credentialId?: string;
  issuer: string;
  checks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  warnings: string[];
  errors: string[];
  credentialSummary: {
    types: string[];
    subject: string | undefined;
    issuanceDate: string;
    expirationDate?: string;
    hasProof: boolean;
  };
}

export const credentialValidateSchema = {
  type: "object" as const,
  properties: {
    credential: {
      type: "object",
      description: "W3C Verifiable Credential to validate",
      properties: {
        "@context": {
          type: "array",
          items: { type: "string" },
          description: "JSON-LD context",
        },
        type: {
          type: "array",
          items: { type: "string" },
          description: "Credential types",
        },
        issuer: {
          oneOf: [
            { type: "string" },
            { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } },
          ],
          description: "Credential issuer",
        },
        issuanceDate: {
          type: "string",
          description: "ISO date when credential was issued",
        },
        expirationDate: {
          type: "string",
          description: "ISO date when credential expires",
        },
        credentialSubject: {
          type: "object",
          description: "Claims about the credential subject",
        },
        proof: {
          type: "object",
          description: "Cryptographic proof",
        },
      },
      required: ["@context", "type", "issuer", "issuanceDate", "credentialSubject"],
    },
    options: {
      type: "object",
      properties: {
        checkExpiry: { type: "boolean", description: "Check if credential is expired (default: true)" },
        verifySignature: { type: "boolean", description: "Verify cryptographic signature (default: true)" },
        checkIssuerTrust: { type: "boolean", description: "Check if issuer is trusted (default: true)" },
        requiredTypes: { type: "array", items: { type: "string" }, description: "Required credential types" },
      },
      description: "Validation options",
    },
  },
  required: ["credential"],
};

// Simulated trusted issuers list
const TRUSTED_ISSUERS = [
  "did:web:government.eu",
  "did:web:eidas-trust.eu",
  "did:web:thesafecompany.com",
  "did:key:",
  "did:web:university.edu",
  "did:web:bank.com",
];

function getIssuerId(issuer: string | { id: string; name?: string }): string {
  return typeof issuer === "string" ? issuer : issuer.id;
}

export async function credentialValidate(args: unknown): Promise<ValidationResult> {
  const { credential, options = {} } = args as CredentialValidateArgs;
  const {
    checkExpiry = true,
    verifySignature = true,
    checkIssuerTrust = true,
    requiredTypes = [],
  } = options;

  const checks: { name: string; passed: boolean; details: string }[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  const issuerId = getIssuerId(credential.issuer);

  // Check 1: Context validation
  const hasBaseContext = credential["@context"]?.includes("https://www.w3.org/2018/credentials/v1");
  checks.push({
    name: "Context",
    passed: hasBaseContext,
    details: hasBaseContext
      ? "Valid W3C Verifiable Credentials context"
      : "Missing required W3C VC context",
  });
  if (!hasBaseContext) {
    errors.push("Credential must include 'https://www.w3.org/2018/credentials/v1' context");
  }

  // Check 2: Type validation
  const hasVCType = credential.type?.includes("VerifiableCredential");
  checks.push({
    name: "Type",
    passed: hasVCType,
    details: hasVCType
      ? `Credential types: ${credential.type.join(", ")}`
      : "Missing 'VerifiableCredential' type",
  });
  if (!hasVCType) {
    errors.push("Credential must include 'VerifiableCredential' type");
  }

  // Check 3: Required types
  if (requiredTypes.length > 0) {
    const hasRequiredTypes = requiredTypes.every((t) => credential.type?.includes(t));
    checks.push({
      name: "Required Types",
      passed: hasRequiredTypes,
      details: hasRequiredTypes
        ? `All required types present: ${requiredTypes.join(", ")}`
        : `Missing required types: ${requiredTypes.filter((t) => !credential.type?.includes(t)).join(", ")}`,
    });
    if (!hasRequiredTypes) {
      errors.push(`Missing required credential types: ${requiredTypes.filter((t) => !credential.type?.includes(t)).join(", ")}`);
    }
  }

  // Check 4: Issuance date
  const issuanceDate = new Date(credential.issuanceDate);
  const isValidIssuanceDate = !isNaN(issuanceDate.getTime()) && issuanceDate <= new Date();
  checks.push({
    name: "Issuance Date",
    passed: isValidIssuanceDate,
    details: isValidIssuanceDate
      ? `Issued on ${credential.issuanceDate}`
      : "Invalid or future issuance date",
  });
  if (!isValidIssuanceDate) {
    errors.push("Credential has invalid or future issuance date");
  }

  // Check 5: Expiry
  if (checkExpiry && credential.expirationDate) {
    const expiryDate = new Date(credential.expirationDate);
    const isExpired = expiryDate < new Date();
    const isExpiringSoon = !isExpired && expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    checks.push({
      name: "Expiry",
      passed: !isExpired,
      details: isExpired
        ? `Credential expired on ${credential.expirationDate}`
        : `Valid until ${credential.expirationDate}`,
    });

    if (isExpired) {
      errors.push(`Credential expired on ${credential.expirationDate}`);
    } else if (isExpiringSoon) {
      warnings.push(`Credential expires within 30 days (${credential.expirationDate})`);
    }
  } else if (checkExpiry && !credential.expirationDate) {
    checks.push({
      name: "Expiry",
      passed: true,
      details: "No expiration date (credential does not expire)",
    });
    warnings.push("Credential has no expiration date - consider if this is appropriate");
  }

  // Check 6: Issuer trust
  if (checkIssuerTrust) {
    const isTrusted = TRUSTED_ISSUERS.some((trusted) => issuerId.startsWith(trusted));
    checks.push({
      name: "Issuer Trust",
      passed: isTrusted,
      details: isTrusted
        ? `Issuer ${issuerId} is in trusted list`
        : `Issuer ${issuerId} is not in trusted list`,
    });
    if (!isTrusted) {
      warnings.push(`Issuer ${issuerId} is not in the trusted issuers list`);
    }
  }

  // Check 7: Proof/Signature
  if (verifySignature) {
    const hasProof = !!credential.proof;
    const hasValidProofStructure = hasProof && credential.proof?.type && credential.proof?.verificationMethod;

    checks.push({
      name: "Proof",
      passed: hasValidProofStructure,
      details: hasValidProofStructure
        ? `Proof type: ${credential.proof!.type}, method: ${credential.proof!.verificationMethod}`
        : hasProof
          ? "Proof structure is incomplete"
          : "No cryptographic proof present",
    });

    if (!hasProof) {
      errors.push("Credential has no cryptographic proof");
    } else if (!hasValidProofStructure) {
      errors.push("Credential proof is missing required fields");
    }

    // Simulated signature verification (in real implementation, would verify crypto)
    if (hasValidProofStructure && (credential.proof?.proofValue || credential.proof?.jws)) {
      checks.push({
        name: "Signature Verification",
        passed: true,
        details: "Signature verification simulated (would verify cryptographically in production)",
      });
    }
  }

  // Check 8: Credential subject
  const hasSubject = !!credential.credentialSubject && Object.keys(credential.credentialSubject).length > 0;
  checks.push({
    name: "Credential Subject",
    passed: hasSubject,
    details: hasSubject
      ? `Subject ID: ${credential.credentialSubject.id || "anonymous"}`
      : "Credential subject is empty",
  });

  // Determine overall validity
  const isValid = errors.length === 0 && checks.every((c) => c.passed);

  return {
    isValid,
    timestamp: new Date().toISOString(),
    credentialId: credential.credentialSubject.id,
    issuer: issuerId,
    checks,
    warnings,
    errors,
    credentialSummary: {
      types: credential.type || [],
      subject: credential.credentialSubject.id,
      issuanceDate: credential.issuanceDate,
      expirationDate: credential.expirationDate,
      hasProof: !!credential.proof,
    },
  };
}
