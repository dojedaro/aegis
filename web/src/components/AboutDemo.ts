export class AboutDemo {
  private containerId: string;

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  render(): void {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="about-hero">
        <h2>AI-Powered Compliance Operations</h2>
        <p>
          A comprehensive demonstration of Claude Code's extensibility features,
          showcasing how AI agents can transform compliance workflows for KYC, AML,
          eIDAS 2.0, and verifiable credentials management.
        </p>
      </div>

      <div class="about-grid">
        <div class="about-card">
          <div class="about-card-icon">🤖</div>
          <h3>AI Agents</h3>
          <p>
            4 specialized subagents handle complex analysis: regulatory compliance,
            risk assessment, audit documentation, and security review. Each agent
            brings domain expertise to automate previously manual workflows.
          </p>
        </div>

        <div class="about-card">
          <div class="about-card-icon">⚡</div>
          <h3>Skills Framework</h3>
          <p>
            5 invocable skills (/compliance-check, /audit-report, /risk-assess,
            /credential-verify, /incident-respond) orchestrate AI agents with
            MCP tools for end-to-end compliance automation.
          </p>
        </div>

        <div class="about-card">
          <div class="about-card-icon">🔧</div>
          <h3>MCP Server</h3>
          <p>
            Custom Model Context Protocol server with 5 tools (regulatory_check,
            audit_log, risk_score, credential_validate, pii_detect) and 2 resources
            for real-time compliance operations.
          </p>
        </div>

        <div class="about-card">
          <div class="about-card-icon">🛡️</div>
          <h3>Intelligent Hooks</h3>
          <p>
            3 automated hooks protect your codebase: PII scanner blocks sensitive
            data writes, audit logger tracks all operations, and compliance gate
            validates commits against regulatory requirements.
          </p>
        </div>
      </div>

      <div class="about-section">
        <h3>🎯 What This Demo Showcases</h3>
        <p>
          This project demonstrates mastery of Claude Code's full extensibility
          stack—skills, hooks, MCP servers, and subagents—applied to a real-world
          compliance operations domain. It represents the architecture patterns
          and integration techniques used to build AI-powered enterprise tools.
        </p>

        <ul class="about-list">
          <li>
            <span class="about-list-icon">◆</span>
            <div class="about-list-content">
              <strong>Skills → Subagent Orchestration</strong>
              <span>Skills invoke specialized AI subagents for deep analysis, demonstrating multi-agent coordination patterns</span>
            </div>
          </li>
          <li>
            <span class="about-list-icon">◆</span>
            <div class="about-list-content">
              <strong>MCP Tool Integration</strong>
              <span>Custom tools extend Claude's capabilities with domain-specific compliance logic</span>
            </div>
          </li>
          <li>
            <span class="about-list-icon">◆</span>
            <div class="about-list-content">
              <strong>Event-Driven Automation</strong>
              <span>Hooks provide deterministic guardrails that run before/after AI actions</span>
            </div>
          </li>
          <li>
            <span class="about-list-icon">◆</span>
            <div class="about-list-content">
              <strong>Regulatory Framework Encoding</strong>
              <span>GDPR, eIDAS 2.0, and AML/KYC requirements encoded as machine-readable rules</span>
            </div>
          </li>
        </ul>
      </div>

      <div class="about-section">
        <h3>🏗️ Architecture Overview</h3>
        <p>
          The platform follows a layered architecture where each component has a specific responsibility:
        </p>

        <div style="background: var(--color-bg); padding: var(--space-6); border-radius: var(--radius-lg); margin: var(--space-4) 0; font-family: var(--font-mono); font-size: var(--text-sm); overflow-x: auto;">
          <pre style="margin: 0; color: var(--color-text-secondary);">
┌─────────────────────────────────────────────────────────────┐
│                    <span style="color: var(--color-primary);">User Interaction Layer</span>                    │
│         CLI Commands  •  Web Dashboard  •  Skills           │
├─────────────────────────────────────────────────────────────┤
│                    <span style="color: var(--color-primary);">AI Orchestration Layer</span>                    │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│    │  Regulatory  │  │     Risk     │  │    Audit     │    │
│    │   Analyst    │  │   Assessor   │  │  Documenter  │    │
│    └──────────────┘  └──────────────┘  └──────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    <span style="color: var(--color-primary);">Tool & Hook Layer</span>                         │
│    MCP Tools: regulatory_check, audit_log, risk_score      │
│    Hooks: pii_scanner, audit_logger, compliance_gate       │
├─────────────────────────────────────────────────────────────┤
│                    <span style="color: var(--color-primary);">Data Layer</span>                                │
│    Regulations DB  •  Audit Trail  •  Risk Matrix          │
└─────────────────────────────────────────────────────────────┘</pre>
        </div>
      </div>

      <div class="about-section">
        <h3>📁 Key Project Files</h3>
        <ul class="about-list">
          <li>
            <span class="about-list-icon">📄</span>
            <div class="about-list-content">
              <strong>CLAUDE.md</strong>
              <span>Project context file that establishes compliance-first development standards and provides Claude with regulatory framework knowledge</span>
            </div>
          </li>
          <li>
            <span class="about-list-icon">📄</span>
            <div class="about-list-content">
              <strong>README.md</strong>
              <span>Comprehensive documentation covering installation, usage, architecture, and all extensibility components</span>
            </div>
          </li>
          <li>
            <span class="about-list-icon">📁</span>
            <div class="about-list-content">
              <strong>.claude/skills/</strong>
              <span>5 skill definitions that orchestrate compliance workflows with AI agents</span>
            </div>
          </li>
          <li>
            <span class="about-list-icon">📁</span>
            <div class="about-list-content">
              <strong>subagents/</strong>
              <span>4 specialized agent prompts with deep domain expertise</span>
            </div>
          </li>
          <li>
            <span class="about-list-icon">📁</span>
            <div class="about-list-content">
              <strong>mcp-server/</strong>
              <span>TypeScript MCP server with 5 tools and 2 resources</span>
            </div>
          </li>
          <li>
            <span class="about-list-icon">📁</span>
            <div class="about-list-content">
              <strong>hooks/</strong>
              <span>3 JavaScript hooks for PII detection, audit logging, and compliance gating</span>
            </div>
          </li>
        </ul>
      </div>

      <div class="about-section">
        <h3>🔐 Regulatory Frameworks Implemented</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--space-4); margin-top: var(--space-4);">
          <div style="background: var(--color-bg-tertiary); padding: var(--space-4); border-radius: var(--radius-lg); border-left: 3px solid var(--color-primary);">
            <strong style="color: var(--color-text);">GDPR</strong>
            <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-2);">
              Data protection principles, consent management, data subject rights, privacy by design
            </p>
          </div>
          <div style="background: var(--color-bg-tertiary); padding: var(--space-4); border-radius: var(--radius-lg); border-left: 3px solid var(--color-secondary);">
            <strong style="color: var(--color-text);">eIDAS 2.0</strong>
            <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-2);">
              Digital identity wallets, qualified trust services, cross-border recognition
            </p>
          </div>
          <div style="background: var(--color-bg-tertiary); padding: var(--space-4); border-radius: var(--radius-lg); border-left: 3px solid var(--color-warning);">
            <strong style="color: var(--color-text);">AML/KYC</strong>
            <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-2);">
              Customer due diligence, sanctions screening, risk-based approach, SAR reporting
            </p>
          </div>
        </div>
      </div>

      <div class="about-disclaimer">
        <span class="about-disclaimer-icon">⚠️</span>
        <div>
          <p>
            <strong>Synthetic Data Notice:</strong> This demo uses entirely synthetic/seed data
            for demonstration purposes. All customer records, credentials, and audit entries are
            fictional. "The Safe Company" is a fictional organization created for this showcase.
            No real personal data, proprietary information, or production systems are involved.
          </p>
        </div>
      </div>

      <div class="about-section" style="text-align: center; background: linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-secondary));">
        <h3 style="margin-bottom: var(--space-4);">Built with Claude Code</h3>
        <p style="max-width: 500px; margin: 0 auto var(--space-6);">
          This project showcases the power of AI-assisted development and Claude Code's
          extensibility features for building enterprise-grade compliance solutions.
        </p>
        <div style="display: flex; justify-content: center; gap: var(--space-4); flex-wrap: wrap;">
          <a href="https://github.com/dojedaro" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="text-decoration: none;">
            View on GitHub
          </a>
          <button class="btn btn-secondary" onclick="document.querySelector('[data-view=overview]').click()">
            Explore Dashboard
          </button>
        </div>
      </div>
    `;
  }
}
