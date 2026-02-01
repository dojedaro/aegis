export class ComplianceStatus {
  private containerId: string;
  private complianceScore: number = 91;

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
              Your compliance posture is strong. 3 items require attention before next audit cycle.
            </p>
          </div>

          <div>
            <h4 style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">
              Breakdown by Framework
            </h4>

            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${this.renderFrameworkBreakdown("GDPR", 92, 11, 12, "1 needs review")}
              ${this.renderFrameworkBreakdown("eIDAS 2.0", 87, 7, 8, "1 in progress")}
              ${this.renderFrameworkBreakdown("AML/KYC", 95, 19, 20, "scheduled review")}
            </div>
          </div>

          <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem;">
            <button class="btn btn-primary">Run Full Check</button>
            <button class="btn btn-secondary">View Report</button>
          </div>
        </div>
      </div>

      <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--color-border);">
        <h4 style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">
          Attention Required
        </h4>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          ${this.renderAlert("warning", "GDPR Art. 30 - Records of Processing", "Processing records need quarterly update", "Due in 5 days")}
          ${this.renderAlert("info", "eIDAS Wallet Integration", "EUDIW compatibility testing in progress", "In progress")}
          ${this.renderAlert("success", "AML Screening Updated", "Sanctions lists refreshed successfully", "Completed")}
        </div>
      </div>
    `;
  }

  private renderFrameworkBreakdown(
    name: string,
    percentage: number,
    met: number,
    total: number,
    note: string
  ): string {
    const color = percentage >= 90 ? "var(--color-success)" : percentage >= 80 ? "var(--color-warning)" : "var(--color-error)";

    return `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span style="width: 80px; font-size: 0.875rem; font-weight: 500; color: var(--color-text-secondary);">${name}</span>
        <div style="flex: 1; height: 6px; background: var(--color-bg-tertiary); border-radius: 3px; overflow: hidden;">
          <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, ${color}dd, ${color}); border-radius: 3px; transition: width 0.8s ease;"></div>
        </div>
        <span style="width: 45px; text-align: right; font-size: 0.875rem; font-weight: 600; color: ${color};">${percentage}%</span>
      </div>
      <div style="display: flex; gap: 0.75rem; margin-left: 80px; margin-top: -0.5rem; margin-bottom: 0.5rem;">
        <span style="font-size: 0.75rem; color: var(--color-text-muted);">✓ ${met}/${total} requirements met</span>
        <span style="font-size: 0.75rem; color: var(--color-text-muted);">• ${note}</span>
      </div>
    `;
  }

  private renderAlert(type: "warning" | "info" | "success", title: string, description: string, status: string): string {
    const colors = {
      warning: { bg: "rgba(234, 179, 8, 0.1)", border: "var(--color-warning)", icon: "⚠" },
      info: { bg: "rgba(74, 158, 255, 0.1)", border: "var(--color-secondary)", icon: "ℹ" },
      success: { bg: "rgba(34, 197, 94, 0.1)", border: "var(--color-success)", icon: "✓" },
    };

    const { bg, border, icon } = colors[type];

    return `
      <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: ${bg}; border-radius: 0.5rem; border-left: 3px solid ${border};">
        <span style="color: ${border}; font-size: 1rem;">${icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 500; font-size: 0.875rem; color: var(--color-text);">${title}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">${description}</div>
        </div>
        <span style="font-size: 0.75rem; color: var(--color-text-muted); white-space: nowrap;">${status}</span>
      </div>
    `;
  }

  updateScore(newScore: number): void {
    this.complianceScore = newScore;
    this.render();
  }
}
