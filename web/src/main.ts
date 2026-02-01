import { ComplianceStatus } from "./components/ComplianceStatus.js";
import { AuditTrail } from "./components/AuditTrail.js";
import { RiskMatrix } from "./components/RiskMatrix.js";
import { CredentialViewer } from "./components/CredentialViewer.js";
import { RegulationsLibrary } from "./components/RegulationsLibrary.js";
import { AboutDemo } from "./components/AboutDemo.js";
import { apiClient } from "./services/ApiClient.js";

// Demo walkthrough functionality
interface DemoStep {
  title: string;
  content: string;
  highlight?: string;
}

const demoSteps: DemoStep[] = [
  {
    title: "Welcome to Aegis",
    content: `
      <p>Aegis is an AI-powered compliance operations platform that demonstrates how Claude Code's extensibility features can transform regulatory compliance workflows.</p>
      <p>This guided tour will show you the key capabilities of the platform.</p>
    `,
  },
  {
    title: "Compliance Dashboard",
    content: `
      <p>The <strong>Overview</strong> shows your real-time compliance status across multiple regulatory frameworks:</p>
      <ul style="margin: 1rem 0; padding-left: 1.5rem; color: var(--color-text-secondary);">
        <li><strong>GDPR</strong> - EU data protection regulation</li>
        <li><strong>eIDAS 2.0</strong> - Digital identity framework</li>
        <li><strong>AML/KYC</strong> - Anti-money laundering requirements</li>
        <li><strong>EU AI Act</strong> - Artificial intelligence regulation</li>
      </ul>
      <p>The compliance gauge shows your overall score, with detailed breakdowns by framework.</p>
    `,
    highlight: "overview",
  },
  {
    title: "AI-Powered Analysis",
    content: `
      <p>Behind the dashboard, <strong>4 specialized AI agents</strong> perform deep analysis:</p>
      <code style="margin: 1rem 0; display: block;">
• Regulatory Analyst - Multi-jurisdiction compliance
• Risk Assessor - Likelihood × impact scoring
• Audit Documenter - Report generation
• Security Reviewer - Privacy impact analysis
      </code>
      <p>These agents are invoked through skills like <strong>/compliance-check</strong> and <strong>/risk-assess</strong>.</p>
    `,
  },
  {
    title: "Audit Trail",
    content: `
      <p>Every operation is logged to an immutable <strong>audit trail</strong> for regulatory compliance:</p>
      <ul style="margin: 1rem 0; padding-left: 1.5rem; color: var(--color-text-secondary);">
        <li>Timestamped entries with actor identification</li>
        <li>Risk level classification</li>
        <li>Compliance relevance flagging</li>
        <li>Export capability for auditors</li>
      </ul>
      <p>The <strong>audit-logger hook</strong> automatically captures all tool operations.</p>
    `,
    highlight: "audit",
  },
  {
    title: "Risk Matrix",
    content: `
      <p>The <strong>Risk Matrix</strong> visualizes risks using a standard likelihood × impact framework:</p>
      <code style="margin: 1rem 0; display: block;">
Risk Score = Likelihood (1-5) × Impact (1-5)

Low:      1-4   (Green)
Medium:   5-9   (Yellow)
High:     10-16 (Orange)
Critical: 17-25 (Red)
      </code>
      <p>Click any cell to see risks at that position.</p>
    `,
    highlight: "risk",
  },
  {
    title: "Credential Verification",
    content: `
      <p>Verify <strong>W3C Verifiable Credentials</strong> with comprehensive validation:</p>
      <ul style="margin: 1rem 0; padding-left: 1.5rem; color: var(--color-text-secondary);">
        <li>JSON-LD context validation</li>
        <li>Issuer trust verification</li>
        <li>Cryptographic signature checks</li>
        <li>Expiry and schema validation</li>
      </ul>
      <p>The <strong>/credential-verify</strong> skill maps results to eIDAS 2.0 compliance.</p>
    `,
    highlight: "credentials",
  },
  {
    title: "Explore Further",
    content: `
      <p>You've seen the key features! To learn more:</p>
      <ul style="margin: 1rem 0; padding-left: 1.5rem; color: var(--color-text-secondary);">
        <li>Visit the <strong>About This Demo</strong> tab for architecture details</li>
        <li>Check the <a href="https://github.com/dojedaro/aegis" target="_blank" style="color: var(--color-primary);">GitHub repository</a> for full source code</li>
        <li>Read the README.md for usage instructions</li>
      </ul>
      <p style="margin-top: 1.5rem; color: var(--color-primary); font-weight: 500;">Built by Daniel Ojeda | AI Enabler</p>
    `,
  },
];

let currentDemoStep = 0;

// Initialize everything when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize components
  const complianceStatus = new ComplianceStatus("compliance-status-widget");
  const auditTrail = new AuditTrail("audit-trail-widget");
  const riskMatrix = new RiskMatrix("risk-matrix-widget");
  const credentialViewer = new CredentialViewer("credential-viewer-widget");
  const regulationsLibrary = new RegulationsLibrary("regulations-content");
  const aboutDemo = new AboutDemo("about-content");

  // Render all components
  complianceStatus.render();
  auditTrail.render();
  riskMatrix.render();
  credentialViewer.render();
  regulationsLibrary.render();
  aboutDemo.render();

  // Initialize stats and activity with API data
  await initializeQuickStats();
  await initializeActivityList();

  // Add click handlers to stat cards
  initializeStatCardClicks();

  // Show connection status
  updateConnectionStatus();

  // Navigation handling
  const navButtons = document.querySelectorAll<HTMLButtonElement>(".nav-btn");
  const views = document.querySelectorAll<HTMLElement>(".view");

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetView = btn.dataset.view;

      // Update active button
      navButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Show target view
      views.forEach((view) => {
        view.classList.remove("active");
        if (view.id === `${targetView}-view`) {
          view.classList.add("active");
        }
      });
    });
  });

  // Demo overlay functions
  function updateDemoUI(): void {
    const step = demoSteps[currentDemoStep];
    const stepContent = document.getElementById("demo-step-content");
    const stepIndicator = document.getElementById("demo-step-indicator");
    const progressBar = document.getElementById("demo-progress-bar");
    const prevBtn = document.getElementById("demo-prev") as HTMLButtonElement;
    const nextBtn = document.getElementById("demo-next") as HTMLButtonElement;

    if (stepContent) {
      stepContent.innerHTML = `<h4>${step.title}</h4>${step.content}`;
    }

    if (stepIndicator) {
      stepIndicator.textContent = `${currentDemoStep + 1} / ${demoSteps.length}`;
    }

    if (progressBar) {
      progressBar.style.width = `${((currentDemoStep + 1) / demoSteps.length) * 100}%`;
    }

    if (prevBtn) {
      prevBtn.disabled = currentDemoStep === 0;
    }

    if (nextBtn) {
      nextBtn.textContent = currentDemoStep === demoSteps.length - 1 ? "Finish" : "Next";
    }

    // Highlight corresponding view if specified
    if (step.highlight) {
      const targetBtn = document.querySelector(`[data-view="${step.highlight}"]`) as HTMLButtonElement;
      if (targetBtn) {
        targetBtn.click();
      }
    }
  }

  function showDemoOverlay(): void {
    const overlay = document.getElementById("demo-overlay");
    if (overlay) {
      overlay.classList.remove("hidden");
      currentDemoStep = 0;
      updateDemoUI();
    }
  }

  function hideDemoOverlay(): void {
    const overlay = document.getElementById("demo-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }

  // Demo controls
  document.getElementById("watch-demo-btn")?.addEventListener("click", showDemoOverlay);
  document.getElementById("demo-close")?.addEventListener("click", hideDemoOverlay);

  document.getElementById("demo-prev")?.addEventListener("click", () => {
    if (currentDemoStep > 0) {
      currentDemoStep--;
      updateDemoUI();
    }
  });

  document.getElementById("demo-next")?.addEventListener("click", () => {
    if (currentDemoStep < demoSteps.length - 1) {
      currentDemoStep++;
      updateDemoUI();
    } else {
      hideDemoOverlay();
    }
  });

  // Close demo on overlay click (outside container)
  document.getElementById("demo-overlay")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
      hideDemoOverlay();
    }
  });

  // Close demo on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hideDemoOverlay();
    }
  });

  // Audit controls
  document.getElementById("audit-period")?.addEventListener("change", (e) => {
    const period = (e.target as HTMLSelectElement).value;
    auditTrail.filterByPeriod(period);
  });

  document.getElementById("audit-filter")?.addEventListener("change", (e) => {
    const filter = (e.target as HTMLSelectElement).value;
    auditTrail.filterByType(filter);
  });

  document.getElementById("export-audit")?.addEventListener("click", () => {
    auditTrail.exportData();
  });

  // Risk controls
  document.getElementById("risk-category")?.addEventListener("change", (e) => {
    const category = (e.target as HTMLSelectElement).value;
    riskMatrix.filterByCategory(category);
  });

  // Console branding
  console.log(
    "%c Aegis Compliance Platform %c v1.0.0 ",
    "background: #00d4aa; color: #0a0a0b; font-weight: bold; padding: 4px 8px; border-radius: 4px 0 0 4px;",
    "background: #1a1a1d; color: #00d4aa; padding: 4px 8px; border-radius: 0 4px 4px 0;"
  );
  console.log("Built by Daniel Ojeda | AI Enabler");
  console.log("https://github.com/dojedaro/aegis");
});

// Initialize quick stats from API
async function initializeQuickStats(): Promise<void> {
  const checksEl = document.getElementById("stat-checks");
  const findingsEl = document.getElementById("stat-findings");
  const riskEl = document.getElementById("stat-risk");
  const auditEl = document.getElementById("stat-audit");

  // Try to get real data from API
  const stats = await apiClient.getComplianceStats();
  const auditData = await apiClient.getAuditEntries({ period: "today" });
  const riskData = await apiClient.getRiskMatrix();

  if (stats && checksEl) {
    checksEl.textContent = String(stats.overview.total_checks || 24);
  }

  if (auditData && auditEl) {
    auditEl.textContent = String(auditData.pagination.total || 156);
  }

  if (riskData && riskEl) {
    const highRisk = (riskData.distribution?.high || 0) + (riskData.distribution?.critical || 0);
    const level = highRisk > 2 ? "High" : highRisk > 0 ? "Medium" : "Low";
    riskEl.textContent = level;
    riskEl.className = `stat-value stat-${level.toLowerCase()}`;
  }

  // Calculate open findings
  if (auditData && findingsEl) {
    const openFindings = auditData.entries.filter(
      (e) => e.risk_level === "high" || e.risk_level === "critical"
    ).length;
    findingsEl.textContent = String(openFindings || 3);
  }
}

// Make stat cards clickable
function initializeStatCardClicks(): void {
  const statCards = document.querySelectorAll(".stat-card");

  statCards.forEach((card, index) => {
    (card as HTMLElement).style.cursor = "pointer";
    card.addEventListener("click", () => {
      const labels = ["checks", "findings", "risk", "audit"];
      const label = labels[index];

      switch (label) {
        case "checks":
          showStatDetail("Compliance Checks Today", `
            <p>Automated compliance checks run in the last 24 hours.</p>
            <div style="margin-top: 1rem;">
              <button class="btn btn-primary" id="run-check-btn">Run New Check</button>
            </div>
          `);
          document.getElementById("run-check-btn")?.addEventListener("click", async () => {
            const result = await apiClient.runComplianceCheck("demo-entity", "customer", ["gdpr", "aml"]);
            if (result) {
              alert(`Compliance check complete! Score: ${result.score}%`);
            }
          });
          break;

        case "findings":
          // Navigate to audit view with high-risk filter
          document.querySelector<HTMLButtonElement>('[data-view="audit"]')?.click();
          const filterEl = document.getElementById("audit-filter") as HTMLSelectElement;
          if (filterEl) {
            filterEl.value = "high-risk";
            filterEl.dispatchEvent(new Event("change"));
          }
          break;

        case "risk":
          // Navigate to risk matrix
          document.querySelector<HTMLButtonElement>('[data-view="risk"]')?.click();
          break;

        case "audit":
          // Navigate to audit trail
          document.querySelector<HTMLButtonElement>('[data-view="audit"]')?.click();
          break;
      }
    });

    // Add hover effect
    card.addEventListener("mouseenter", () => {
      (card as HTMLElement).style.transform = "translateY(-2px)";
      (card as HTMLElement).style.boxShadow = "0 4px 12px rgba(0, 212, 170, 0.15)";
    });
    card.addEventListener("mouseleave", () => {
      (card as HTMLElement).style.transform = "none";
      (card as HTMLElement).style.boxShadow = "none";
    });
  });
}

function showStatDetail(title: string, content: string): void {
  const existingModal = document.getElementById("stat-detail-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.id = "stat-detail-modal";
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
    <div style="background: var(--color-bg-secondary); border-radius: 1rem; max-width: 500px; width: 100%; border: 1px solid var(--color-border); padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="color: var(--color-text); margin: 0;">${title}</h3>
        <button id="close-stat-modal" style="background: none; border: none; color: var(--color-text-muted); font-size: 1.5rem; cursor: pointer;">&times;</button>
      </div>
      <div style="color: var(--color-text-secondary);">
        ${content}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("close-stat-modal")?.addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Initialize activity list with API data
async function initializeActivityList(): Promise<void> {
  const activityList = document.getElementById("activity-list");
  if (!activityList) return;

  // Try to get real data from API
  const auditData = await apiClient.getAuditEntries({ period: "today" });

  if (auditData && auditData.entries.length > 0) {
    const activities = auditData.entries.slice(0, 5).map((entry) => {
      const isSuccess = entry.risk_level === "low";
      const isWarning = entry.risk_level === "medium";
      const isError = entry.risk_level === "high" || entry.risk_level === "critical";

      return {
        icon: isSuccess ? "✓" : isWarning ? "⚠" : isError ? "✗" : "•",
        type: isSuccess ? "success" : isWarning ? "warning" : isError ? "error" : "info",
        title: entry.action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        time: formatTimeAgo(new Date(entry.timestamp)),
      };
    });

    activityList.innerHTML = activities
      .map(
        (a) => `
        <div class="activity-item">
          <div class="activity-icon ${a.type}">${a.icon}</div>
          <div class="activity-content">
            <div class="activity-title">${a.title}</div>
            <div class="activity-time">${a.time}</div>
          </div>
        </div>
      `
      )
      .join("");
  } else {
    // Fallback to demo data
    const activities = [
      { icon: "✓", type: "success", title: "Compliance check passed", time: "2 minutes ago" },
      { icon: "⚠", type: "warning", title: "Risk assessment flagged", time: "15 minutes ago" },
      { icon: "✓", type: "success", title: "Credential verified", time: "1 hour ago" },
      { icon: "✗", type: "error", title: "PII detected in commit", time: "2 hours ago" },
      { icon: "✓", type: "success", title: "Audit report generated", time: "3 hours ago" },
    ];

    activityList.innerHTML = activities
      .map(
        (a) => `
        <div class="activity-item">
          <div class="activity-icon ${a.type}">${a.icon}</div>
          <div class="activity-content">
            <div class="activity-title">${a.title}</div>
            <div class="activity-time">${a.time}</div>
          </div>
        </div>
      `
      )
      .join("");
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function updateConnectionStatus(): void {
  const statusEl = document.querySelector(".header-status");
  if (statusEl) {
    const indicator = statusEl.querySelector(".status-indicator");
    const text = statusEl.querySelector("span:last-child");

    if (apiClient.isConnected) {
      indicator?.classList.remove("status-warning");
      indicator?.classList.add("status-ok");
      if (text) text.textContent = "API Connected";
    } else {
      indicator?.classList.remove("status-ok");
      indicator?.classList.add("status-warning");
      if (text) text.textContent = "Demo Mode";
    }
  }
}
