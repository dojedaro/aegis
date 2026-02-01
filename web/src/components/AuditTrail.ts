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
  private currentPage: number = 1;
  private pageSize: number = 5;

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
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        action: "config_change",
        actor: "admin",
        resource: "settings:security",
        result: "success",
        riskLevel: "high",
        complianceRelevant: true,
      },
      {
        id: "audit_008",
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        action: "incident_response",
        actor: "security-team",
        resource: "incident:INC-001",
        result: "pending",
        riskLevel: "critical",
        complianceRelevant: true,
      },
      {
        id: "audit_009",
        timestamp: new Date(now.getTime() - 7 * 60 * 60 * 1000).toISOString(),
        action: "customer_onboarding",
        actor: "analyst-2",
        resource: "customer:C-11111",
        result: "success",
        riskLevel: "medium",
        complianceRelevant: true,
      },
      {
        id: "audit_010",
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        action: "document_verification",
        actor: "system",
        resource: "document:DOC-456",
        result: "success",
        riskLevel: "low",
        complianceRelevant: true,
      },
      {
        id: "audit_011",
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        action: "sanctions_screening",
        actor: "system",
        resource: "customer:C-12348",
        result: "success",
        riskLevel: "medium",
        complianceRelevant: true,
      },
      {
        id: "audit_012",
        timestamp: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(),
        action: "pep_screening",
        actor: "system",
        resource: "customer:C-12348",
        result: "failure",
        riskLevel: "high",
        complianceRelevant: true,
      },
    ];
    this.filteredEntries = [...this.entries];
  }

  private get totalPages(): number {
    return Math.ceil(this.filteredEntries.length / this.pageSize);
  }

  private get paginatedEntries(): AuditEntry[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEntries.slice(start, start + this.pageSize);
  }

  render(): void {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const startIdx = (this.currentPage - 1) * this.pageSize + 1;
    const endIdx = Math.min(this.currentPage * this.pageSize, this.filteredEntries.length);

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
            ${this.paginatedEntries.map((entry) => this.renderRow(entry)).join("")}
          </tbody>
        </table>
      </div>

      <div class="audit-pagination" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding: 0 0.5rem;">
        <span style="font-size: 0.875rem; color: var(--color-text-muted);">
          Showing ${this.filteredEntries.length > 0 ? startIdx : 0}-${endIdx} of ${this.filteredEntries.length} entries
        </span>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="btn btn-secondary" id="audit-prev-btn" ${this.currentPage <= 1 ? "disabled" : ""}>Previous</button>
          <span style="font-size: 0.875rem; color: var(--color-text-muted); padding: 0 0.5rem;">
            Page ${this.currentPage} of ${this.totalPages || 1}
          </span>
          <button class="btn btn-secondary" id="audit-next-btn" ${this.currentPage >= this.totalPages ? "disabled" : ""}>Next</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    document.getElementById("audit-prev-btn")?.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.render();
      }
    });

    document.getElementById("audit-next-btn")?.addEventListener("click", () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.render();
      }
    });

    // Add click handlers for rows to show details
    const rows = document.querySelectorAll("#audit-trail-widget tbody tr");
    rows.forEach((row, index) => {
      row.addEventListener("click", () => {
        const entry = this.paginatedEntries[index];
        if (entry) {
          this.showEntryDetails(entry);
        }
      });
      (row as HTMLElement).style.cursor = "pointer";
    });
  }

  private showEntryDetails(entry: AuditEntry): void {
    const existingModal = document.getElementById("audit-detail-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "audit-detail-modal";
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

    const riskColor = entry.riskLevel === "critical" ? "var(--color-error)" :
                      entry.riskLevel === "high" ? "var(--color-warning)" :
                      entry.riskLevel === "medium" ? "var(--color-warning)" : "var(--color-success)";

    modal.innerHTML = `
      <div style="background: var(--color-bg-secondary); border-radius: 1rem; max-width: 500px; width: 100%; border: 1px solid var(--color-border);">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="color: var(--color-text); font-size: 1.25rem;">Audit Entry Details</h3>
          <button id="close-audit-modal" style="background: none; border: none; color: var(--color-text-muted); font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <div style="display: grid; gap: 1rem;">
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">ID</div>
              <div style="color: var(--color-text); font-family: monospace;">${entry.id}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Timestamp</div>
              <div style="color: var(--color-text);">${new Date(entry.timestamp).toLocaleString()}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Action</div>
              <div style="color: var(--color-text); font-weight: 500;">${entry.action}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Actor</div>
              <div style="color: var(--color-text); font-family: monospace;">${entry.actor}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Resource</div>
              <div style="color: var(--color-text); font-family: monospace;">${entry.resource}</div>
            </div>
            <div style="display: flex; gap: 2rem;">
              <div>
                <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Result</div>
                <div style="color: ${entry.result === "success" ? "var(--color-success)" : entry.result === "failure" ? "var(--color-error)" : "var(--color-warning)"}; font-weight: 500;">
                  ${entry.result === "success" ? "✓" : entry.result === "failure" ? "✗" : "○"} ${entry.result}
                </div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Risk Level</div>
                <div style="color: ${riskColor}; font-weight: 500;">${entry.riskLevel || "N/A"}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Compliance</div>
                <div style="color: var(--color-text);">${entry.complianceRelevant ? "Yes" : "No"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("close-audit-modal")?.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });
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
        this.currentPage = 1;
        this.render();
        return;
    }

    this.filteredEntries = this.entries.filter((e) => new Date(e.timestamp) >= cutoff);
    this.currentPage = 1;
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
    this.currentPage = 1;
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
