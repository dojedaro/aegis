interface VerificationResult {
  isValid: boolean;
  checks: { name: string; passed: boolean; details: string }[];
  warnings: string[];
  errors: string[];
}

export class CredentialViewer {
  private containerId: string;
  private sampleCredential: object;
  private verificationResult: VerificationResult | null = null;

  constructor(containerId: string) {
    this.containerId = containerId;
    this.sampleCredential = {
      "@context": ["https://www.w3.org/2018/credentials/v1", "https://www.w3.org/2018/credentials/examples/v1"],
      type: ["VerifiableCredential", "IdentityCredential"],
      issuer: {
        id: "did:web:government.eu",
        name: "EU Government Identity Service",
      },
      issuanceDate: "2024-01-01T00:00:00Z",
      expirationDate: "2025-06-15T00:00:00Z",
      credentialSubject: {
        id: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
        givenName: "Maria",
        familyName: "Garcia",
        dateOfBirth: "1990-05-15",
        nationality: "ES",
      },
      proof: {
        type: "Ed25519Signature2020",
        created: "2024-01-01T00:00:00Z",
        verificationMethod: "did:web:government.eu#key-1",
        proofPurpose: "assertionMethod",
        proofValue: "z5LgmVhjpSXB4...truncated",
      },
    };
  }

  render(): void {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <div>
          <div class="verification-form">
            <h3 style="margin-bottom: 1rem;">Verify Credential</h3>
            <div class="form-group">
              <label class="form-label">Credential JSON</label>
              <textarea class="form-textarea" id="credential-input">${JSON.stringify(this.sampleCredential, null, 2)}</textarea>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-primary" id="verify-btn">Verify Credential</button>
              <button class="btn btn-secondary" id="clear-btn">Clear</button>
              <button class="btn btn-secondary" id="sample-btn">Load Sample</button>
            </div>
          </div>
        </div>

        <div>
          <div id="verification-result">
            ${this.verificationResult ? this.renderResult() : this.renderPlaceholder()}
          </div>
        </div>
      </div>

      <div style="margin-top: 2rem;">
        <h3 style="font-size: 1rem; color: var(--color-text-muted); margin-bottom: 1rem;">RECENTLY VERIFIED</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
          ${this.renderRecentCredential("Identity Credential", "Maria Garcia", "Valid", "2 minutes ago")}
          ${this.renderRecentCredential("Education Credential", "John Smith", "Valid", "1 hour ago")}
          ${this.renderRecentCredential("Employment Credential", "Sarah Johnson", "Expired", "3 hours ago")}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private renderPlaceholder(): string {
    return `
      <div style="background: var(--color-bg-tertiary); border-radius: 0.75rem; padding: 3rem; text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🎫</div>
        <h3 style="margin-bottom: 0.5rem;">No Credential Verified</h3>
        <p style="color: var(--color-text-muted);">
          Paste a W3C Verifiable Credential JSON and click "Verify" to see validation results.
        </p>
      </div>
    `;
  }

  private renderResult(): string {
    if (!this.verificationResult) return this.renderPlaceholder();

    const result = this.verificationResult;
    const statusClass = result.isValid ? "valid" : "invalid";
    const statusText = result.isValid ? "✓ VALID" : "✗ INVALID";

    return `
      <div class="credential-card">
        <div class="credential-header">
          <div class="credential-type">
            <span class="credential-type-badge">VerifiableCredential</span>
            <span class="credential-type-badge">IdentityCredential</span>
          </div>
          <div class="credential-status ${statusClass}">${statusText}</div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 0.75rem;">VERIFICATION CHECKS</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${result.checks
              .map(
                (check) => `
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="color: var(--color-${check.passed ? "success" : "error"});">
                  ${check.passed ? "✓" : "✗"}
                </span>
                <div style="flex: 1;">
                  <span style="font-weight: 500;">${check.name}</span>
                  <span style="color: var(--color-text-muted); font-size: 0.875rem; margin-left: 0.5rem;">
                    ${check.details}
                  </span>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        ${
          result.warnings.length > 0
            ? `
          <div style="margin-bottom: 1rem;">
            <h4 style="font-size: 0.875rem; color: var(--color-warning); margin-bottom: 0.5rem;">⚠ WARNINGS</h4>
            ${result.warnings.map((w) => `<div style="font-size: 0.875rem; color: var(--color-text-muted);">• ${w}</div>`).join("")}
          </div>
        `
            : ""
        }

        ${
          result.errors.length > 0
            ? `
          <div style="margin-bottom: 1rem;">
            <h4 style="font-size: 0.875rem; color: var(--color-error); margin-bottom: 0.5rem;">✗ ERRORS</h4>
            ${result.errors.map((e) => `<div style="font-size: 0.875rem; color: var(--color-text-muted);">• ${e}</div>`).join("")}
          </div>
        `
            : ""
        }

        <div class="credential-details">
          <div class="credential-field">
            <span class="credential-field-label">Issuer</span>
            <span class="credential-field-value">did:web:government.eu</span>
          </div>
          <div class="credential-field">
            <span class="credential-field-label">Subject</span>
            <span class="credential-field-value">Maria Garcia</span>
          </div>
          <div class="credential-field">
            <span class="credential-field-label">Issued</span>
            <span class="credential-field-value">2024-01-01</span>
          </div>
          <div class="credential-field">
            <span class="credential-field-label">Expires</span>
            <span class="credential-field-value">2025-06-15</span>
          </div>
        </div>
      </div>
    `;
  }

  private renderRecentCredential(type: string, subject: string, status: string, time: string): string {
    const isValid = status === "Valid";
    return `
      <div style="background: var(--color-bg-tertiary); padding: 1rem; border-radius: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <span style="font-weight: 500;">${type}</span>
          <span class="credential-status ${isValid ? "valid" : "invalid"}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
            ${isValid ? "✓" : "✗"} ${status}
          </span>
        </div>
        <div style="font-size: 0.875rem; color: var(--color-text-muted);">${subject}</div>
        <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.5rem;">${time}</div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    const verifyBtn = document.getElementById("verify-btn");
    const clearBtn = document.getElementById("clear-btn");
    const sampleBtn = document.getElementById("sample-btn");
    const input = document.getElementById("credential-input") as HTMLTextAreaElement;

    verifyBtn?.addEventListener("click", () => {
      this.verifyCredential(input?.value || "");
    });

    clearBtn?.addEventListener("click", () => {
      if (input) input.value = "";
      this.verificationResult = null;
      this.render();
    });

    sampleBtn?.addEventListener("click", () => {
      if (input) input.value = JSON.stringify(this.sampleCredential, null, 2);
    });
  }

  private verifyCredential(jsonString: string): void {
    try {
      const credential = JSON.parse(jsonString);

      // Perform validation checks
      const checks: { name: string; passed: boolean; details: string }[] = [];
      const warnings: string[] = [];
      const errors: string[] = [];

      // Context check
      const hasContext = credential["@context"]?.includes("https://www.w3.org/2018/credentials/v1");
      checks.push({
        name: "Context",
        passed: hasContext,
        details: hasContext ? "Valid W3C VC context" : "Missing W3C context",
      });
      if (!hasContext) errors.push("Missing required W3C VC context");

      // Type check
      const hasType = credential.type?.includes("VerifiableCredential");
      checks.push({
        name: "Type",
        passed: hasType,
        details: hasType ? credential.type.join(", ") : "Missing VerifiableCredential type",
      });
      if (!hasType) errors.push("Missing VerifiableCredential type");

      // Issuer check
      const hasIssuer = !!credential.issuer;
      const issuerTrusted = hasIssuer && (typeof credential.issuer === "string" ? credential.issuer : credential.issuer.id)?.includes("government");
      checks.push({
        name: "Issuer",
        passed: issuerTrusted,
        details: issuerTrusted ? "Trusted issuer" : hasIssuer ? "Issuer not in trusted list" : "No issuer",
      });
      if (!issuerTrusted && hasIssuer) warnings.push("Issuer not in trusted list");

      // Expiry check
      const expiryDate = credential.expirationDate ? new Date(credential.expirationDate) : null;
      const isExpired = expiryDate && expiryDate < new Date();
      checks.push({
        name: "Expiry",
        passed: !isExpired,
        details: isExpired ? "Credential expired" : expiryDate ? `Valid until ${expiryDate.toLocaleDateString()}` : "No expiration",
      });
      if (isExpired) errors.push("Credential has expired");

      // Proof check
      const hasProof = !!credential.proof?.type && !!credential.proof?.proofValue;
      checks.push({
        name: "Proof",
        passed: hasProof,
        details: hasProof ? `${credential.proof.type} present` : "Missing or incomplete proof",
      });
      if (!hasProof) errors.push("Missing cryptographic proof");

      // Subject check
      const hasSubject = !!credential.credentialSubject && Object.keys(credential.credentialSubject).length > 0;
      checks.push({
        name: "Subject",
        passed: hasSubject,
        details: hasSubject ? "Subject claims present" : "Empty subject",
      });

      this.verificationResult = {
        isValid: errors.length === 0,
        checks,
        warnings,
        errors,
      };

      this.render();
    } catch {
      this.verificationResult = {
        isValid: false,
        checks: [],
        warnings: [],
        errors: ["Invalid JSON format"],
      };
      this.render();
    }
  }
}
