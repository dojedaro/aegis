import { regulations, getArticle } from "../data/regulations.js";

interface Finding {
  id: string;
  framework: string;
  articleId: string;
  title: string;
  description: string;
  status: "warning" | "info" | "success" | "error";
  dueDate?: string;
}

export class ComplianceStatus {
  private containerId: string;
  private complianceScore: number = 91;
  private isRunningCheck: boolean = false;

  private findings: Finding[] = [
    {
      id: "finding-1",
      framework: "gdpr",
      articleId: "gdpr-art-30",
      title: "GDPR Art. 30 - Records of Processing",
      description: "Processing records need quarterly update",
      status: "warning",
      dueDate: "Due in 5 days"
    },
    {
      id: "finding-2",
      framework: "eidas",
      articleId: "eidas-art-5a",
      title: "eIDAS Art. 5a - Digital Identity Wallet",
      description: "EUDIW compatibility testing in progress",
      status: "info",
      dueDate: "In progress"
    },
    {
      id: "finding-3",
      framework: "aml",
      articleId: "aml-art-46",
      title: "AML Art. 46 - Sanctions Screening",
      description: "Sanctions lists refreshed successfully",
      status: "success",
      dueDate: "Completed"
    },
    {
      id: "finding-4",
      framework: "eu-ai-act",
      articleId: "ai-art-14",
      title: "EU AI Act Art. 14 - Human Oversight",
      description: "Human-in-the-loop documentation required for biometric AI",
      status: "warning",
      dueDate: "Due in 2 weeks"
    }
  ];

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  render(): void {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const widgetContent = container.querySelector(".widget-content");
    if (!widgetContent) return;

    const gaugeValue = (this.complianceScore / 100) * 360;

    widgetContent.innerHTML = `
      <div style="display: flex; gap: 3rem; align-items: flex-start;">
        <div class="compliance-gauge">
          <div class="gauge-circle" style="--gauge-value: ${gaugeValue}deg;">
            <span class="gauge-value">${this.complianceScore}%</span>
          </div>
          <div class="gauge-label">Overall Compliance</div>
        </div>

        <div style="flex: 1;">
          <div style="margin-bottom: 2rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
              <span style="width: 10px; height: 10px; background: var(--color-success); border-radius: 50%; box-shadow: 0 0 8px var(--color-success);"></span>
              <h3 style="color: var(--color-text); font-size: 1.125rem; font-weight: 600;">Status: Operational</h3>
            </div>
            <p style="color: var(--color-text-muted); font-size: 0.875rem; line-height: 1.6;">
              Your compliance posture is strong. ${this.findings.filter(f => f.status === "warning").length} items require attention before next audit cycle.
            </p>
          </div>

          <div>
            <h4 style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">
              Breakdown by Framework
            </h4>

            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${this.renderFrameworkBreakdown("GDPR", 92, 11, 12, "1 needs review", "gdpr")}
              ${this.renderFrameworkBreakdown("eIDAS 2.0", 87, 7, 8, "1 in progress", "eidas")}
              ${this.renderFrameworkBreakdown("AML/KYC", 95, 19, 20, "scheduled review", "aml")}
              ${this.renderFrameworkBreakdown("EU AI Act", 78, 9, 12, "3 need review", "eu-ai-act")}
            </div>
          </div>

          <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem;">
            <button class="btn btn-primary" id="run-full-check-btn">${this.isRunningCheck ? '<span class="spinner"></span> Running...' : 'Run Full Check'}</button>
            <button class="btn btn-secondary" id="view-report-btn">View Report</button>
          </div>
        </div>
      </div>

      <div id="check-results" style="display: none; margin-top: 1.5rem; padding: 1.5rem; background: var(--color-bg-tertiary); border-radius: 0.75rem; border: 1px solid var(--color-border);">
        <h4 style="font-size: 0.875rem; color: var(--color-primary); margin-bottom: 1rem;">✓ Compliance Check Complete</h4>
        <div id="check-results-content"></div>
      </div>

      <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--color-border);">
        <h4 style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">
          Attention Required <span style="font-weight: 400; color: var(--color-text-muted);">(Click for regulation details)</span>
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${this.findings.map(finding => this.renderFinding(finding)).join("")}
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    const runCheckBtn = document.getElementById("run-full-check-btn");
    const viewReportBtn = document.getElementById("view-report-btn");

    runCheckBtn?.addEventListener("click", () => this.runFullCheck());
    viewReportBtn?.addEventListener("click", () => this.viewReport());

    // Finding click handlers
    document.querySelectorAll("[data-finding-id]").forEach(el => {
      el.addEventListener("click", () => {
        const findingId = (el as HTMLElement).dataset.findingId;
        const finding = this.findings.find(f => f.id === findingId);
        if (finding) {
          this.showArticleDetail(finding.framework, finding.articleId);
        }
      });
    });
  }

  private renderFinding(finding: Finding): string {
    const colors = {
      warning: { bg: "rgba(234, 179, 8, 0.1)", border: "var(--color-warning)", icon: "⚠" },
      info: { bg: "rgba(74, 158, 255, 0.1)", border: "var(--color-secondary)", icon: "ℹ" },
      success: { bg: "rgba(34, 197, 94, 0.1)", border: "var(--color-success)", icon: "✓" },
      error: { bg: "rgba(239, 68, 68, 0.1)", border: "var(--color-error)", icon: "✗" }
    };

    const { bg, border, icon } = colors[finding.status];

    return `
      <div
        data-finding-id="${finding.id}"
        style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: ${bg}; border-radius: 0.5rem; border-left: 3px solid ${border}; cursor: pointer; transition: transform 0.15s ease;"
        onmouseover="this.style.transform='translateX(4px)'"
        onmouseout="this.style.transform='none'"
      >
        <span style="color: ${border}; font-size: 1rem;">${icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 500; font-size: 0.875rem; color: var(--color-text); display: flex; align-items: center; gap: 0.5rem;">
            ${finding.title}
            <span style="font-size: 0.625rem; color: var(--color-primary);">↗ View Article</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">${finding.description}</div>
        </div>
        <span style="font-size: 0.75rem; color: var(--color-text-muted); white-space: nowrap;">${finding.dueDate}</span>
      </div>
    `;
  }

  private showArticleDetail(frameworkId: string, articleId: string): void {
    const framework = regulations.find(f => f.id === frameworkId);
    const article = framework?.articles.find(a => a.id === articleId);

    if (!article || !framework) {
      console.error("Article not found:", frameworkId, articleId);
      return;
    }

    const existingModal = document.getElementById("article-detail-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "article-detail-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
    `;

    modal.innerHTML = `
      <div style="background: var(--color-bg-secondary); border-radius: 1rem; max-width: 700px; width: 100%; max-height: 85vh; overflow-y: auto; border: 1px solid var(--color-border);">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: flex-start; position: sticky; top: 0; background: var(--color-bg-secondary); z-index: 1;">
          <div>
            <span style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: var(--color-primary-subtle); color: var(--color-primary); border-radius: 0.25rem; display: inline-block; margin-bottom: 0.5rem;">${framework.name}</span>
            <h3 style="color: var(--color-text); font-size: 1.25rem; margin: 0;">${article.title}</h3>
          </div>
          <button id="close-article-modal" style="background: none; border: none; color: var(--color-text-muted); font-size: 1.5rem; cursor: pointer; padding: 0.25rem;">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">Summary</h4>
            <p style="color: var(--color-text); line-height: 1.7; font-size: 1rem;">${article.summary}</p>
          </div>

          <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--color-primary-subtle); border-radius: 0.5rem; border-left: 3px solid var(--color-primary);">
            <h4 style="font-size: 0.75rem; color: var(--color-primary); text-transform: uppercase; margin-bottom: 0.5rem;">Why It Matters for Identity/KYC</h4>
            <p style="color: var(--color-text-secondary); line-height: 1.6; font-size: 0.9375rem;">${article.relevance}</p>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.75rem;">Related Topics</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${article.keywords.map(k => `<span style="font-size: 0.8125rem; padding: 0.375rem 0.75rem; background: var(--color-bg-tertiary); color: var(--color-text-secondary); border-radius: 0.375rem;">${k}</span>`).join("")}
            </div>
          </div>

          <div style="display: flex; gap: 0.75rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--color-border);">
            <a href="${article.officialLink}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="flex: 1; text-align: center; text-decoration: none;">
              View on EUR-Lex ↗
            </a>
            <a href="${framework.officialLink}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="flex: 1; text-align: center; text-decoration: none;">
              Full ${framework.name} Text ↗
            </a>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("close-article-modal")?.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  private async runFullCheck(): Promise<void> {
    if (this.isRunningCheck) return;

    this.isRunningCheck = true;
    const btn = document.getElementById("run-full-check-btn");
    const resultsDiv = document.getElementById("check-results");
    const resultsContent = document.getElementById("check-results-content");

    if (btn) {
      btn.innerHTML = '<span class="spinner"></span> Running...';
      (btn as HTMLButtonElement).disabled = true;
    }

    const steps = [
      { text: "Scanning for PII patterns...", delay: 600 },
      { text: "Checking GDPR requirements...", delay: 500 },
      { text: "Validating eIDAS 2.0 compliance...", delay: 500 },
      { text: "Analyzing AML/KYC controls...", delay: 500 },
      { text: "Evaluating EU AI Act requirements...", delay: 500 },
      { text: "Generating report...", delay: 400 },
    ];

    if (resultsDiv && resultsContent) {
      resultsDiv.style.display = "block";
      resultsContent.innerHTML = '<div class="check-progress"></div>';
      const progressDiv = resultsContent.querySelector(".check-progress");

      for (const step of steps) {
        if (progressDiv) {
          progressDiv.innerHTML = `<span style="color: var(--color-text-muted);">${step.text}</span>`;
        }
        await this.delay(step.delay);
      }

      resultsContent.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem;">
          <div style="text-align: center; padding: 1rem; background: var(--color-bg-secondary); border-radius: 0.5rem;">
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success);">✓</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">PII Scan</div>
            <div style="font-size: 0.875rem; color: var(--color-success);">Clear</div>
          </div>
          <div style="text-align: center; padding: 1rem; background: var(--color-bg-secondary); border-radius: 0.5rem;">
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-warning);">3</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Findings</div>
            <div style="font-size: 0.875rem; color: var(--color-warning);">Review</div>
          </div>
          <div style="text-align: center; padding: 1rem; background: var(--color-bg-secondary); border-radius: 0.5rem;">
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">91%</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Score</div>
            <div style="font-size: 0.875rem; color: var(--color-primary);">Good</div>
          </div>
          <div style="text-align: center; padding: 1rem; background: var(--color-bg-secondary); border-radius: 0.5rem;">
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-text);">4</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">Frameworks</div>
            <div style="font-size: 0.875rem; color: var(--color-text-secondary);">Checked</div>
          </div>
        </div>
        <div style="font-size: 0.875rem; color: var(--color-text-secondary);">
          <strong>Findings (click to see regulation):</strong>
          <ul style="margin-top: 0.5rem; padding-left: 1.25rem; color: var(--color-text-muted);">
            <li style="cursor: pointer; margin-bottom: 0.25rem;" onclick="document.querySelector('[data-finding-id=finding-1]')?.click()">
              <span style="color: var(--color-primary);">GDPR Art. 30</span> - Records of Processing needs update
            </li>
            <li style="cursor: pointer; margin-bottom: 0.25rem;" onclick="document.querySelector('[data-finding-id=finding-4]')?.click()">
              <span style="color: var(--color-primary);">EU AI Act Art. 14</span> - Human oversight documentation required
            </li>
            <li style="cursor: pointer;" onclick="document.querySelector('[data-finding-id=finding-2]')?.click()">
              <span style="color: var(--color-primary);">eIDAS Art. 5a</span> - Wallet integration in progress
            </li>
          </ul>
        </div>
        <div style="margin-top: 1rem; font-size: 0.75rem; color: var(--color-text-muted);">
          Check completed at ${new Date().toLocaleTimeString()}
        </div>
      `;
    }

    this.isRunningCheck = false;
    if (btn) {
      btn.innerHTML = "Run Full Check";
      (btn as HTMLButtonElement).disabled = false;
    }
  }

  private viewReport(): void {
    const existingModal = document.getElementById("report-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "report-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
    `;

    modal.innerHTML = `
      <div style="background: var(--color-bg-secondary); border-radius: 1rem; max-width: 700px; width: 100%; max-height: 80vh; overflow-y: auto; border: 1px solid var(--color-border);">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="color: var(--color-text); font-size: 1.25rem;">Compliance Report</h3>
          <button id="close-report-modal" style="background: none; border: none; color: var(--color-text-muted); font-size: 1.5rem; cursor: pointer; padding: 0.25rem;">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <div style="margin-bottom: 1.5rem;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">Report Generated</div>
            <div style="color: var(--color-text);">${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">Overall Score</div>
            <div style="font-size: 2rem; font-weight: 700; color: var(--color-primary);">${this.complianceScore}%</div>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.75rem;">Framework Status</div>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid var(--color-border);">
                <td style="padding: 0.75rem 0; color: var(--color-text);">GDPR</td>
                <td style="padding: 0.75rem 0; text-align: right; color: var(--color-success);">92% (11/12)</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--color-border);">
                <td style="padding: 0.75rem 0; color: var(--color-text);">eIDAS 2.0</td>
                <td style="padding: 0.75rem 0; text-align: right; color: var(--color-warning);">87% (7/8)</td>
              </tr>
              <tr style="border-bottom: 1px solid var(--color-border);">
                <td style="padding: 0.75rem 0; color: var(--color-text);">AML/KYC</td>
                <td style="padding: 0.75rem 0; text-align: right; color: var(--color-success);">95% (19/20)</td>
              </tr>
              <tr>
                <td style="padding: 0.75rem 0; color: var(--color-text);">EU AI Act</td>
                <td style="padding: 0.75rem 0; text-align: right; color: var(--color-warning);">78% (9/12)</td>
              </tr>
            </table>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.75rem;">Open Items</div>
            <ul style="padding-left: 1.25rem; color: var(--color-text-secondary); font-size: 0.875rem;">
              <li style="margin-bottom: 0.5rem;">GDPR Art. 30 - Records of Processing (Due in 5 days)</li>
              <li style="margin-bottom: 0.5rem;">EU AI Act Art. 14 - Human Oversight Documentation (Due in 2 weeks)</li>
              <li style="margin-bottom: 0.5rem;">eIDAS Art. 5a - Wallet Integration (In progress)</li>
              <li>AML Art. 46 - Next scheduled screening review</li>
            </ul>
          </div>

          <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
            <button id="download-report-btn" class="btn btn-primary" style="flex: 1;">Download PDF</button>
            <button id="export-json-btn" class="btn btn-secondary" style="flex: 1;">Export JSON</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("close-report-modal")?.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    document.getElementById("download-report-btn")?.addEventListener("click", () => {
      alert("PDF download would be generated here in a production environment.");
    });

    document.getElementById("export-json-btn")?.addEventListener("click", () => {
      const report = {
        generatedAt: new Date().toISOString(),
        overallScore: this.complianceScore,
        frameworks: {
          gdpr: { score: 92, met: 11, total: 12 },
          eidas: { score: 87, met: 7, total: 8 },
          aml: { score: 95, met: 19, total: 20 },
          euAiAct: { score: 78, met: 9, total: 12 }
        },
        findings: this.findings
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private renderFrameworkBreakdown(
    name: string,
    percentage: number,
    met: number,
    total: number,
    note: string,
    frameworkId: string
  ): string {
    const color = percentage >= 90 ? "var(--color-success)" : percentage >= 80 ? "var(--color-warning)" : "var(--color-error)";
    const framework = regulations.find(f => f.id === frameworkId);

    return `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <a href="${framework?.officialLink || "#"}" target="_blank" rel="noopener noreferrer" style="width: 90px; font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary); text-decoration: none; transition: color 0.15s;" onmouseover="this.style.color='var(--color-primary)'" onmouseout="this.style.color='var(--color-text-secondary)'">${name} ↗</a>
        <div style="flex: 1; height: 6px; background: var(--color-bg-tertiary); border-radius: 3px; overflow: hidden;">
          <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, ${color}dd, ${color}); border-radius: 3px; transition: width 0.8s ease;"></div>
        </div>
        <span style="width: 45px; text-align: right; font-size: 0.875rem; font-weight: 600; color: ${color};">${percentage}%</span>
      </div>
      <div style="display: flex; gap: 0.75rem; margin-left: 90px; margin-top: -0.5rem; margin-bottom: 0.5rem;">
        <span style="font-size: 0.75rem; color: var(--color-text-muted);">✓ ${met}/${total} requirements met</span>
        <span style="font-size: 0.75rem; color: var(--color-text-muted);">• ${note}</span>
      </div>
    `;
  }

  updateScore(newScore: number): void {
    this.complianceScore = newScore;
    this.render();
  }
}
