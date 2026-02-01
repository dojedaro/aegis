interface RiskItem {
  id: string;
  name: string;
  category: string;
  likelihood: number;
  impact: number;
  score: number;
  level: "low" | "medium" | "high" | "critical";
}

export class RiskMatrix {
  private containerId: string;
  private risks: RiskItem[] = [];
  private filteredRisks: RiskItem[] = [];

  constructor(containerId: string) {
    this.containerId = containerId;
    this.loadSampleData();
  }

  private loadSampleData(): void {
    this.risks = [
      {
        id: "risk_001",
        name: "Cross-border data transfer",
        category: "compliance",
        likelihood: 4,
        impact: 4,
        score: 16,
        level: "high",
      },
      {
        id: "risk_002",
        name: "PEP exposure",
        category: "compliance",
        likelihood: 2,
        impact: 5,
        score: 10,
        level: "high",
      },
      {
        id: "risk_003",
        name: "Manual verification errors",
        category: "operational",
        likelihood: 3,
        impact: 3,
        score: 9,
        level: "medium",
      },
      {
        id: "risk_004",
        name: "Transaction fraud",
        category: "financial",
        likelihood: 2,
        impact: 4,
        score: 8,
        level: "medium",
      },
      {
        id: "risk_005",
        name: "System availability",
        category: "operational",
        likelihood: 2,
        impact: 3,
        score: 6,
        level: "medium",
      },
      {
        id: "risk_006",
        name: "Documentation gaps",
        category: "compliance",
        likelihood: 3,
        impact: 2,
        score: 6,
        level: "medium",
      },
      {
        id: "risk_007",
        name: "Vendor dependency",
        category: "operational",
        likelihood: 2,
        impact: 2,
        score: 4,
        level: "low",
      },
    ];
    this.filteredRisks = [...this.risks];
  }

  render(): void {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <div>
          <h3 style="font-size: 1rem; color: var(--color-text-muted); margin-bottom: 1rem;">RISK HEAT MAP</h3>
          ${this.renderMatrix()}

          <div style="display: flex; gap: 1rem; margin-top: 1rem; font-size: 0.75rem;">
            <span><span class="risk-badge low">●</span> Low (1-4)</span>
            <span><span class="risk-badge medium">●</span> Medium (5-9)</span>
            <span><span class="risk-badge high">●</span> High (10-16)</span>
            <span><span class="risk-badge critical">●</span> Critical (17-25)</span>
          </div>
        </div>

        <div>
          <h3 style="font-size: 1rem; color: var(--color-text-muted); margin-bottom: 1rem;">TOP RISKS</h3>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${this.filteredRisks
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((risk) => this.renderRiskCard(risk))
              .join("")}
          </div>
        </div>
      </div>

      <div style="margin-top: 2rem;">
        <h3 style="font-size: 1rem; color: var(--color-text-muted); margin-bottom: 1rem;">ALL RISKS BY CATEGORY</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Risk</th>
              <th>Category</th>
              <th>L</th>
              <th>I</th>
              <th>Score</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            ${this.filteredRisks.map((risk) => this.renderRiskRow(risk)).join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  private renderMatrix(): string {
    const cells: string[] = [];

    // Header row
    cells.push('<div class="risk-label">L\\I</div>');
    for (let i = 1; i <= 5; i++) {
      cells.push(`<div class="risk-label">${i}</div>`);
    }

    // Risk cells
    for (let l = 5; l >= 1; l--) {
      cells.push(`<div class="risk-label">${l}</div>`);
      for (let i = 1; i <= 5; i++) {
        const score = l * i;
        const level = this.getLevel(score);
        const risksAtCell = this.filteredRisks.filter((r) => r.likelihood === l && r.impact === i);
        const count = risksAtCell.length;
        const tooltip = risksAtCell.map((r) => r.name).join(", ") || `Score: ${score}`;

        cells.push(`
          <div class="risk-cell ${level}" title="${tooltip}" data-score="${score}">
            ${count > 0 ? count : score}
          </div>
        `);
      }
    }

    return `
      <div class="risk-matrix">
        ${cells.join("")}
      </div>
    `;
  }

  private renderRiskCard(risk: RiskItem): string {
    return `
      <div style="background: var(--color-bg-tertiary); padding: 1rem; border-radius: 0.5rem; border-left: 3px solid var(--color-${risk.level === "critical" ? "error" : risk.level === "high" ? "warning" : risk.level === "medium" ? "warning" : "success"});">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-weight: 500; margin-bottom: 0.25rem;">${risk.name}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">${risk.category}</div>
          </div>
          <span class="risk-badge ${risk.level}">${risk.score}</span>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.75rem; color: var(--color-text-muted);">
          <span>Likelihood: ${risk.likelihood}</span>
          <span>Impact: ${risk.impact}</span>
        </div>
      </div>
    `;
  }

  private renderRiskRow(risk: RiskItem): string {
    return `
      <tr>
        <td style="font-weight: 500;">${risk.name}</td>
        <td>
          <span style="padding: 0.25rem 0.5rem; background: var(--color-bg-tertiary); border-radius: 0.25rem; font-size: 0.75rem; text-transform: uppercase;">
            ${risk.category}
          </span>
        </td>
        <td style="text-align: center;">${risk.likelihood}</td>
        <td style="text-align: center;">${risk.impact}</td>
        <td style="text-align: center; font-weight: 600;">${risk.score}</td>
        <td><span class="risk-badge ${risk.level}">${risk.level}</span></td>
      </tr>
    `;
  }

  private getLevel(score: number): "low" | "medium" | "high" | "critical" {
    if (score <= 4) return "low";
    if (score <= 9) return "medium";
    if (score <= 16) return "high";
    return "critical";
  }

  filterByCategory(category: string): void {
    if (category === "all") {
      this.filteredRisks = [...this.risks];
    } else {
      this.filteredRisks = this.risks.filter((r) => r.category === category);
    }
    this.render();
  }
}
