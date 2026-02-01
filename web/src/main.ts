import { ComplianceStatus } from "./components/ComplianceStatus.js";
import { AuditTrail } from "./components/AuditTrail.js";
import { RiskMatrix } from "./components/RiskMatrix.js";
import { CredentialViewer } from "./components/CredentialViewer.js";
import { RegulationsLibrary } from "./components/RegulationsLibrary.js";
import { AboutDemo } from "./components/AboutDemo.js";

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
document.addEventListener("DOMContentLoaded", () => {
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
  initializeActivityList();

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

// Initialize activity list with sample data
function initializeActivityList(): void {
  const activityList = document.getElementById("activity-list");
  if (!activityList) return;

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
