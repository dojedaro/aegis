interface VerificationResult {
  isValid: boolean;
  checks: { name: string; passed: boolean; details: string }[];
  warnings: string[];
  errors: string[];
  credentialData?: {
    issuer: string;
    subject: string;
    issuedDate: string;
    expiryDate: string;
    types: string[];
  };
}

export class CredentialViewer {
  private containerId: string;
  private sampleCredential: object;
  private verificationResult: VerificationResult | null = null;
  private isVerifying: boolean = false;

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
              <textarea class="form-textarea" id="credential-input" placeholder="Paste a W3C Verifiable Credential JSON here...">${JSON.stringify(this.sampleCredential, null, 2)}</textarea>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-primary" id="verify-btn" ${this.isVerifying ? "disabled" : ""}>
                ${this.isVerifying ? '<span class="spinner"></span> Verifying...' : 'Verify Credential'}
              </button>
              <button class="btn btn-secondary" id="clear-btn">Clear</button>
              <button class="btn btn-secondary" id="sample-btn">Load Sample</button>
              <button class="btn btn-secondary" id="sample-invalid-btn">Load Invalid</button>
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1rem; color: var(--color-text-muted);">RECENTLY VERIFIED</h3>
          <button class="btn btn-secondary" id="clear-history-btn" style="font-size: 0.75rem; padding: 0.375rem 0.75rem;">Clear History</button>
        </div>
        <div id="recent-credentials" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
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
      <div style="background: var(--color-bg-tertiary); border-radius: 0.75rem; padding: 3rem; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; min-height: 300px;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🎫</div>
        <h3 style="margin-bottom: 0.5rem;">No Credential Verified</h3>
        <p style="color: var(--color-text-muted);">
          Paste a W3C Verifiable Credential JSON and click "Verify" to see validation results.
        </p>
        <p style="color: var(--color-text-muted); font-size: 0.875rem; margin-top: 1rem;">
          Or click "Load Sample" to try with example data.
        </p>
      </div>
    `;
  }

  private renderResult(): string {
    if (!this.verificationResult) return this.renderPlaceholder();

    const result = this.verificationResult;
    const statusClass = result.isValid ? "valid" : "invalid";
    const statusText = result.isValid ? "✓ VALID" : "✗ INVALID";
    const statusBg = result.isValid ? "var(--color-success-bg)" : "var(--color-error-bg)";
    const statusColor = result.isValid ? "var(--color-success)" : "var(--color-error)";

    return `
      <div class="credential-card" style="background: var(--color-bg-tertiary); border-radius: 0.75rem; padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border);">
          <div>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
              ${result.credentialData?.types.map(t => `<span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: var(--color-primary-subtle); color: var(--color-primary); border-radius: 0.25rem;">${t}</span>`).join("") || ""}
            </div>
          </div>
          <div style="background: ${statusBg}; color: ${statusColor}; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem;">
            ${statusText}
          </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.75rem;">VERIFICATION CHECKS</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${result.checks
              .map(
                (check) => `
              <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; background: ${check.passed ? "var(--color-success-bg)" : "var(--color-error-bg)"}; border-radius: 0.375rem;">
                <span style="color: var(--color-${check.passed ? "success" : "error"}); font-size: 1rem;">
                  ${check.passed ? "✓" : "✗"}
                </span>
                <div style="flex: 1;">
                  <span style="font-weight: 500; color: var(--color-text);">${check.name}</span>
                  <span style="color: var(--color-text-muted); font-size: 0.75rem; margin-left: 0.5rem;">
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
          <div style="margin-bottom: 1rem; padding: 1rem; background: var(--color-warning-bg); border-radius: 0.5rem;">
            <h4 style="font-size: 0.875rem; color: var(--color-warning); margin-bottom: 0.5rem;">⚠ Warnings</h4>
            ${result.warnings.map((w) => `<div style="font-size: 0.875rem; color: var(--color-text-secondary);">• ${w}</div>`).join("")}
          </div>
        `
            : ""
        }

        ${
          result.errors.length > 0
            ? `
          <div style="margin-bottom: 1rem; padding: 1rem; background: var(--color-error-bg); border-radius: 0.5rem;">
            <h4 style="font-size: 0.875rem; color: var(--color-error); margin-bottom: 0.5rem;">✗ Errors</h4>
            ${result.errors.map((e) => `<div style="font-size: 0.875rem; color: var(--color-text-secondary);">• ${e}</div>`).join("")}
          </div>
        `
            : ""
        }

        ${result.credentialData ? `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border);">
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Issuer</div>
              <div style="font-size: 0.875rem; color: var(--color-text); font-family: monospace; word-break: break-all;">${result.credentialData.issuer}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Subject</div>
              <div style="font-size: 0.875rem; color: var(--color-text);">${result.credentialData.subject}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Issued</div>
              <div style="font-size: 0.875rem; color: var(--color-text);">${result.credentialData.issuedDate}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Expires</div>
              <div style="font-size: 0.875rem; color: var(--color-text);">${result.credentialData.expiryDate}</div>
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

  private renderRecentCredential(type: string, subject: string, status: string, time: string): string {
    const isValid = status === "Valid";
    return `
      <div style="background: var(--color-bg-tertiary); padding: 1rem; border-radius: 0.5rem; cursor: pointer; transition: transform 0.15s ease;" class="recent-cred-card" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <span style="font-weight: 500;">${type}</span>
          <span style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 0.25rem; background: ${isValid ? "var(--color-success-bg)" : "var(--color-error-bg)"}; color: ${isValid ? "var(--color-success)" : "var(--color-error)"};">
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
    const sampleInvalidBtn = document.getElementById("sample-invalid-btn");
    const clearHistoryBtn = document.getElementById("clear-history-btn");
    const input = document.getElementById("credential-input") as HTMLTextAreaElement;

    verifyBtn?.addEventListener("click", async () => {
      await this.verifyCredential(input?.value || "");
    });

    clearBtn?.addEventListener("click", () => {
      if (input) input.value = "";
      this.verificationResult = null;
      this.render();
    });

    sampleBtn?.addEventListener("click", () => {
      if (input) input.value = JSON.stringify(this.sampleCredential, null, 2);
    });

    sampleInvalidBtn?.addEventListener("click", () => {
      const invalidCredential = {
        "@context": ["https://example.com/invalid"],
        type: ["SomeCredential"],
        issuer: "did:web:unknown-issuer.xyz",
        credentialSubject: {},
      };
      if (input) input.value = JSON.stringify(invalidCredential, null, 2);
    });

    clearHistoryBtn?.addEventListener("click", () => {
      const recentDiv = document.getElementById("recent-credentials");
      if (recentDiv) {
        recentDiv.innerHTML = `
          <div style="grid-column: span 3; text-align: center; padding: 2rem; color: var(--color-text-muted);">
            No recent verifications
          </div>
        `;
      }
    });

    // Click handlers for recent credential cards
    document.querySelectorAll(".recent-cred-card").forEach(card => {
      card.addEventListener("click", () => {
        // Load sample and verify
        if (input) input.value = JSON.stringify(this.sampleCredential, null, 2);
        this.verifyCredential(JSON.stringify(this.sampleCredential));
      });
    });
  }

  private async verifyCredential(jsonString: string): Promise<void> {
    this.isVerifying = true;
    this.render();

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 800));

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
      const issuerId = typeof credential.issuer === "string" ? credential.issuer : credential.issuer?.id;
      const issuerTrusted = hasIssuer && issuerId?.includes("government");
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

      // Extract credential data for display
      const credentialData = {
        issuer: issuerId || "Unknown",
        subject: credential.credentialSubject?.givenName && credential.credentialSubject?.familyName
          ? `${credential.credentialSubject.givenName} ${credential.credentialSubject.familyName}`
          : credential.credentialSubject?.id || "Unknown",
        issuedDate: credential.issuanceDate ? new Date(credential.issuanceDate).toLocaleDateString() : "Unknown",
        expiryDate: credential.expirationDate ? new Date(credential.expirationDate).toLocaleDateString() : "No expiration",
        types: credential.type || [],
      };

      this.verificationResult = {
        isValid: errors.length === 0,
        checks,
        warnings,
        errors,
        credentialData,
      };

      this.isVerifying = false;
      this.render();
    } catch {
      this.verificationResult = {
        isValid: false,
        checks: [],
        warnings: [],
        errors: ["Invalid JSON format - please check your input"],
      };
      this.isVerifying = false;
      this.render();
    }
  }
}
