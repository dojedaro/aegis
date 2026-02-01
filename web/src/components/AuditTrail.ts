interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  resource: string;
  result: "success" | "failure" | "pending";
  riskLevel?: "low" | "medium" | "high" | "critical";
  complianceRelevant: boolean;
}

export class AuditTrail {
  private containerId: string;
  private entries: AuditEntry[] = [];
  private filteredEntries: AuditEntry[] = [];

  constructor(containerId: string) {
    this.containerId = containerId;
    this.loadSampleData();
  }

  private loadSampleData(): void {
    const now = new Date();
    this.entries = [
      {
        id: "audit_001",
        timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
        action: "compliance_check",
        actor: "analyst-1",
        resource: "src/services/user.ts",
        result: "success",
        riskLevel: "low",
        complianceRelevant: true,
      },
      {
        id: "audit_002",
        timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
        action: "risk_assessment",
        actor: "system",
        resource: "customer:C-12345",
        result: "success",
        riskLevel: "high",
        complianceRelevant: true,
      },
      {
        id: "audit_003",
        timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        action: "credential_verify",
        actor: "analyst-1",
        resource: "credential:vc-789",
        result: "success",
        riskLevel: "low",
        complianceRelevant: true,
      },
      {
        id: "audit_004",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        action: "pii_scan",
        actor: "hook:pii-scanner",
        resource: "file:config.json",
        result: "failure",
        riskLevel: "critical",
        complianceRelevant: true,
      },
      {
        id: "audit_005",
        timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        action: "audit_report",
        actor: "analyst-2",
        resource: "report:monthly-jan",
        result: "success",
        riskLevel: "low",
        complianceRelevant: true,
      },
      {
        id: "audit_006",
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        action: "data_access",
        actor: "analyst-1",
        resource: "customer:C-67890",
        result: "success",
        riskLevel: "medium",
        complianceRelevant: false,
      },
      {
        id: "audit_007",
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        action: "config_change",
        actor: "admin",
        resource: "settings:security",
        result: "success",
        riskLevel: "high",
        complianceRelevant: true,
      },
      {
        id: "audit_008",
        timestamp: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(),
        action: "incident_response",
        actor: "security-team",
        resource: "incident:INC-001",
        result: "pending",
        riskLevel: "critical",
        complianceRelevant: true,
      },
    ];
    this.filteredEntries = [...this.entries];
  }

  render(): void {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="audit-summary" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
        <div class="stat-card">
          <span class="stat-value">${this.entries.length}</span>
          <span class="stat-label">Total Events</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${this.entries.filter((e) => e.complianceRelevant).length}</span>
          <span class="stat-label">Compliance Events</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" style="color: var(--color-warning);">${this.entries.filter((e) => e.riskLevel === "high" || e.riskLevel === "critical").length}</span>
          <span class="stat-label">High Risk</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" style="color: var(--color-error);">${this.entries.filter((e) => e.result === "failure").length}</span>
          <span class="stat-label">Failed</span>
        </div>
      </div>

      <div class="audit-table-container" style="background: var(--color-bg-secondary); border-radius: 0.75rem; overflow: hidden;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Resource</th>
              <th>Result</th>
              <th>Risk</th>
            </tr>
          </thead>
          <tbody>
            ${this.filteredEntries.map((entry) => this.renderRow(entry)).join("")}
          </tbody>
        </table>
      </div>

      <div class="audit-pagination" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding: 0 0.5rem;">
        <span style="font-size: 0.875rem; color: var(--color-text-muted);">
          Showing ${this.filteredEntries.length} of ${this.entries.length} entries
        </span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary" disabled>Previous</button>
          <button class="btn btn-secondary" disabled>Next</button>
        </div>
      </div>
    `;
  }

  private renderRow(entry: AuditEntry): string {
    const time = new Date(entry.timestamp).toLocaleString();
    const resultClass = entry.result === "success" ? "success" : entry.result === "failure" ? "error" : "warning";
    const resultIcon = entry.result === "success" ? "✓" : entry.result === "failure" ? "✗" : "○";

    return `
      <tr>
        <td style="font-size: 0.875rem; color: var(--color-text-muted);">${time}</td>
        <td>
          <span style="font-weight: 500;">${entry.action}</span>
          ${entry.complianceRelevant ? '<span style="margin-left: 0.5rem; font-size: 0.625rem; padding: 0.125rem 0.375rem; background: rgba(0, 212, 170, 0.2); color: var(--color-primary); border-radius: 0.25rem;">COMPLIANCE</span>' : ""}
        </td>
        <td style="font-family: monospace; font-size: 0.875rem;">${entry.actor}</td>
        <td style="font-family: monospace; font-size: 0.875rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${entry.resource}</td>
        <td>
          <span style="color: var(--color-${resultClass});">${resultIcon} ${entry.result}</span>
        </td>
        <td>
          ${entry.riskLevel ? `<span class="risk-badge ${entry.riskLevel}">${entry.riskLevel}</span>` : "-"}
        </td>
      </tr>
    `;
  }

  filterByPeriod(period: string): void {
    const now = new Date();
    let cutoff: Date;

    switch (period) {
      case "today":
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        this.filteredEntries = [...this.entries];
        this.render();
        return;
    }

    this.filteredEntries = this.entries.filter((e) => new Date(e.timestamp) >= cutoff);
    this.render();
  }

  filterByType(type: string): void {
    switch (type) {
      case "compliance":
        this.filteredEntries = this.entries.filter((e) => e.complianceRelevant);
        break;
      case "high-risk":
        this.filteredEntries = this.entries.filter((e) => e.riskLevel === "high" || e.riskLevel === "critical");
        break;
      default:
        this.filteredEntries = [...this.entries];
    }
    this.render();
  }

  exportData(): void {
    const dataStr = JSON.stringify(this.filteredEntries, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
