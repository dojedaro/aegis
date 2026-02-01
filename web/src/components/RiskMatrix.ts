interface RiskItem {
  id: string;
  name: string;
  category: string;
  likelihood: number;
  impact: number;
  score: number;
  level: "low" | "medium" | "high" | "critical";
  description?: string;
  mitigation?: string;
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
        description: "Personal data transferred outside EU without adequate safeguards",
        mitigation: "Implement Standard Contractual Clauses (SCCs) and conduct Transfer Impact Assessments",
      },
      {
        id: "risk_002",
        name: "PEP exposure",
        category: "compliance",
        likelihood: 2,
        impact: 5,
        score: 10,
        level: "high",
        description: "Potential business relationship with Politically Exposed Persons",
        mitigation: "Enhanced due diligence, senior management approval, ongoing monitoring",
      },
      {
        id: "risk_003",
        name: "Manual verification errors",
        category: "operational",
        likelihood: 3,
        impact: 3,
        score: 9,
        level: "medium",
        description: "Human errors in document verification process",
        mitigation: "Implement automated verification, dual-review for high-risk cases",
      },
      {
        id: "risk_004",
        name: "Transaction fraud",
        category: "financial",
        likelihood: 2,
        impact: 4,
        score: 8,
        level: "medium",
        description: "Fraudulent transactions through compromised accounts",
        mitigation: "Real-time transaction monitoring, ML-based anomaly detection",
      },
      {
        id: "risk_005",
        name: "System availability",
        category: "operational",
        likelihood: 2,
        impact: 3,
        score: 6,
        level: "medium",
        description: "Service interruption affecting business operations",
        mitigation: "Multi-region deployment, automated failover, 99.9% SLA targets",
      },
      {
        id: "risk_006",
        name: "Documentation gaps",
        category: "compliance",
        likelihood: 3,
        impact: 2,
        score: 6,
        level: "medium",
        description: "Incomplete audit trails or missing compliance documentation",
        mitigation: "Automated audit logging, periodic documentation reviews",
      },
      {
        id: "risk_007",
        name: "Vendor dependency",
        category: "operational",
        likelihood: 2,
        impact: 2,
        score: 4,
        level: "low",
        description: "Over-reliance on single third-party service providers",
        mitigation: "Multi-vendor strategy, regular vendor assessments",
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
          <p style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 1rem;">Click any cell to see risks at that position</p>
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1rem; color: var(--color-text-muted);">ALL RISKS BY CATEGORY</h3>
          <button class="btn btn-primary" id="add-risk-btn" style="font-size: 0.875rem; padding: 0.5rem 1rem;">+ Add Risk</button>
        </div>
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

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // Click handlers for matrix cells
    const cells = document.querySelectorAll(".risk-cell");
    cells.forEach((cell) => {
      cell.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLElement;
        const likelihood = parseInt(target.dataset.likelihood || "0");
        const impact = parseInt(target.dataset.impact || "0");
        this.showCellDetails(likelihood, impact);
      });
    });

    // Click handlers for risk cards
    const cards = document.querySelectorAll("[data-risk-id]");
    cards.forEach((card) => {
      card.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLElement;
        const riskId = target.dataset.riskId;
        const risk = this.risks.find(r => r.id === riskId);
        if (risk) {
          this.showRiskDetails(risk);
        }
      });
    });

    // Click handlers for table rows
    const rows = document.querySelectorAll("#risk-matrix-widget tbody tr");
    rows.forEach((row) => {
      const riskId = (row as HTMLElement).dataset.riskId;
      row.addEventListener("click", () => {
        const risk = this.risks.find(r => r.id === riskId);
        if (risk) {
          this.showRiskDetails(risk);
        }
      });
      (row as HTMLElement).style.cursor = "pointer";
    });

    // Add risk button
    document.getElementById("add-risk-btn")?.addEventListener("click", () => this.showAddRiskModal());
  }

  private showCellDetails(likelihood: number, impact: number): void {
    const risksAtCell = this.filteredRisks.filter(r => r.likelihood === likelihood && r.impact === impact);
    const score = likelihood * impact;
    const level = this.getLevel(score);

    const existingModal = document.getElementById("cell-detail-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "cell-detail-modal";
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
      <div style="background: var(--color-bg-secondary); border-radius: 1rem; max-width: 500px; width: 100%; border: 1px solid var(--color-border);">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="color: var(--color-text); font-size: 1.25rem;">Risk Position: L${likelihood} × I${impact}</h3>
          <button id="close-cell-modal" style="background: none; border: none; color: var(--color-text-muted); font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <div style="display: flex; gap: 2rem; margin-bottom: 1.5rem;">
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Score</div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--color-primary);">${score}</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Level</div>
              <div><span class="risk-badge ${level}" style="font-size: 1rem; padding: 0.5rem 1rem;">${level.toUpperCase()}</span></div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Risks</div>
              <div style="font-size: 2rem; font-weight: 700; color: var(--color-text);">${risksAtCell.length}</div>
            </div>
          </div>

          ${risksAtCell.length > 0 ? `
            <div style="font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 0.75rem;">Risks at this position:</div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              ${risksAtCell.map(r => `
                <div style="background: var(--color-bg-tertiary); padding: 0.75rem; border-radius: 0.5rem; cursor: pointer;" class="cell-risk-item" data-risk-id="${r.id}">
                  <div style="font-weight: 500; color: var(--color-text);">${r.name}</div>
                  <div style="font-size: 0.75rem; color: var(--color-text-muted);">${r.category}</div>
                </div>
              `).join("")}
            </div>
          ` : `
            <div style="text-align: center; padding: 2rem; color: var(--color-text-muted);">
              No risks currently at this position.
            </div>
          `}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("close-cell-modal")?.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    // Click handlers for risk items in modal
    modal.querySelectorAll(".cell-risk-item").forEach(item => {
      item.addEventListener("click", () => {
        const riskId = (item as HTMLElement).dataset.riskId;
        const risk = this.risks.find(r => r.id === riskId);
        if (risk) {
          modal.remove();
          this.showRiskDetails(risk);
        }
      });
    });
  }

  private showRiskDetails(risk: RiskItem): void {
    const existingModal = document.getElementById("risk-detail-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "risk-detail-modal";
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

    const levelColor = risk.level === "critical" ? "var(--color-error)" :
                       risk.level === "high" ? "var(--color-warning)" :
                       risk.level === "medium" ? "var(--color-warning)" : "var(--color-success)";

    modal.innerHTML = `
      <div style="background: var(--color-bg-secondary); border-radius: 1rem; max-width: 600px; width: 100%; border: 1px solid var(--color-border);">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="color: var(--color-text); font-size: 1.25rem; margin-bottom: 0.25rem;">${risk.name}</h3>
            <span style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">${risk.category}</span>
          </div>
          <button id="close-risk-modal" style="background: none; border: none; color: var(--color-text-muted); font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <div style="display: flex; gap: 1.5rem; margin-bottom: 1.5rem;">
            <div style="flex: 1; background: var(--color-bg-tertiary); padding: 1rem; border-radius: 0.5rem; text-align: center;">
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Likelihood</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-text);">${risk.likelihood}</div>
            </div>
            <div style="flex: 1; background: var(--color-bg-tertiary); padding: 1rem; border-radius: 0.5rem; text-align: center;">
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Impact</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-text);">${risk.impact}</div>
            </div>
            <div style="flex: 1; background: var(--color-bg-tertiary); padding: 1rem; border-radius: 0.5rem; text-align: center;">
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Score</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: ${levelColor};">${risk.score}</div>
            </div>
            <div style="flex: 1; background: var(--color-bg-tertiary); padding: 1rem; border-radius: 0.5rem; text-align: center;">
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Level</div>
              <div><span class="risk-badge ${risk.level}">${risk.level}</span></div>
            </div>
          </div>

          ${risk.description ? `
            <div style="margin-bottom: 1.5rem;">
              <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">Description</div>
              <div style="color: var(--color-text-secondary); line-height: 1.6;">${risk.description}</div>
            </div>
          ` : ""}

          ${risk.mitigation ? `
            <div style="margin-bottom: 1.5rem;">
              <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">Mitigation Strategy</div>
              <div style="color: var(--color-text-secondary); line-height: 1.6; background: var(--color-primary-subtle); padding: 1rem; border-radius: 0.5rem; border-left: 3px solid var(--color-primary);">${risk.mitigation}</div>
            </div>
          ` : ""}

          <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
            <button class="btn btn-secondary" style="flex: 1;" id="edit-risk-btn">Edit Risk</button>
            <button class="btn btn-secondary" style="flex: 1; color: var(--color-error);" id="delete-risk-btn">Delete</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("close-risk-modal")?.addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.remove();
    });

    document.getElementById("edit-risk-btn")?.addEventListener("click", () => {
      alert("Edit functionality would open a form to modify this risk.");
    });

    document.getElementById("delete-risk-btn")?.addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete "${risk.name}"?`)) {
        this.risks = this.risks.filter(r => r.id !== risk.id);
        this.filteredRisks = this.filteredRisks.filter(r => r.id !== risk.id);
        modal.remove();
        this.render();
      }
    });
  }

  private showAddRiskModal(): void {
    const existingModal = document.getElementById("add-risk-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "add-risk-modal";
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
      <div style="background: var(--color-bg-secondary); border-radius: 1rem; max-width: 500px; width: 100%; border: 1px solid var(--color-border);">
        <div style="padding: 1.5rem; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="color: var(--color-text); font-size: 1.25rem;">Add New Risk</h3>
          <button id="close-add-modal" style="background: none; border: none; color: var(--color-text-muted); font-size: 1.5rem; cursor: pointer;">&times;</button>
        </div>
        <div style="padding: 1.5rem;">
          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">Risk Name</label>
            <input type="text" id="risk-name" class="form-input" placeholder="Enter risk name" style="width: 100%; padding: 0.75rem; background: var(--color-bg-tertiary); border: 1px solid var(--color-border); border-radius: 0.5rem; color: var(--color-text);">
          </div>
          <div style="margin-bottom: 1rem;">
            <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">Category</label>
            <select id="risk-category" style="width: 100%; padding: 0.75rem; background: var(--color-bg-tertiary); border: 1px solid var(--color-border); border-radius: 0.5rem; color: var(--color-text);">
              <option value="compliance">Compliance</option>
              <option value="operational">Operational</option>
              <option value="financial">Financial</option>
            </select>
          </div>
          <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">Likelihood (1-5)</label>
              <input type="number" id="risk-likelihood" min="1" max="5" value="3" style="width: 100%; padding: 0.75rem; background: var(--color-bg-tertiary); border: 1px solid var(--color-border); border-radius: 0.5rem; color: var(--color-text);">
            </div>
            <div style="flex: 1;">
              <label style="display: block; font-size: 0.875rem; color: var(--color-text-muted); margin-bottom: 0.5rem;">Impact (1-5)</label>
              <input type="number" id="risk-impact" min="1" max="5" value="3" style="width: 100%; padding: 0.75rem; background: var(--color-bg-tertiary); border: 1px solid var(--color-border); border-radius: 0.5rem; color: var(--color-text);">
            </div>
          </div>
          <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
            <button class="btn btn-secondary" style="flex: 1;" id="cancel-add-btn">Cancel</button>
            <button class="btn btn-primary" style="flex: 1;" id="save-risk-btn">Add Risk</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    document.getElementById("close-add-modal")?.addEventListener("click", closeModal);
    document.getElementById("cancel-add-btn")?.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    document.getElementById("save-risk-btn")?.addEventListener("click", () => {
      const name = (document.getElementById("risk-name") as HTMLInputElement).value.trim();
      const category = (document.getElementById("risk-category") as HTMLSelectElement).value;
      const likelihood = parseInt((document.getElementById("risk-likelihood") as HTMLInputElement).value);
      const impact = parseInt((document.getElementById("risk-impact") as HTMLInputElement).value);

      if (!name) {
        alert("Please enter a risk name");
        return;
      }

      const score = likelihood * impact;
      const newRisk: RiskItem = {
        id: `risk_${Date.now()}`,
        name,
        category,
        likelihood,
        impact,
        score,
        level: this.getLevel(score),
      };

      this.risks.push(newRisk);
      this.filteredRisks.push(newRisk);
      closeModal();
      this.render();
    });
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
          <div class="risk-cell ${level}" title="${tooltip}" data-score="${score}" data-likelihood="${l}" data-impact="${i}" style="cursor: pointer;">
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
    const borderColor = risk.level === "critical" ? "var(--color-error)" : risk.level === "high" ? "var(--color-warning)" : risk.level === "medium" ? "var(--color-warning)" : "var(--color-success)";

    return `
      <div style="background: var(--color-bg-tertiary); padding: 1rem; border-radius: 0.5rem; border-left: 3px solid ${borderColor}; cursor: pointer; transition: transform 0.15s ease;" data-risk-id="${risk.id}" onmouseover="this.style.transform='translateX(4px)'" onmouseout="this.style.transform='none'">
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
      <tr data-risk-id="${risk.id}">
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
