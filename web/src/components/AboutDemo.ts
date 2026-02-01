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
        <h2>Transforming Compliance with AI Agents</h2>
        <p>
          From hours to seconds — this platform demonstrates how AI agents can automate
          complex regulatory workflows that traditionally require specialized teams.
        </p>
      </div>

      <div class="about-section" style="background: linear-gradient(135deg, var(--color-primary-subtle), transparent); margin-bottom: var(--space-8);">
        <h3 style="color: var(--color-text);">🎯 The Impact</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-6); margin-top: var(--space-6);">
          <div style="text-align: center;">
            <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-primary);">4-8 hrs</div>
            <div style="font-size: var(--text-sm); color: var(--color-text-muted);">Traditional Review</div>
            <div style="font-size: 1.5rem; margin: 0.5rem 0;">→</div>
            <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-success);">&lt; 30s</div>
            <div style="font-size: var(--text-sm); color: var(--color-text-muted);">With Aegis</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-primary);">1</div>
            <div style="font-size: var(--text-sm); color: var(--color-text-muted);">Framework at a time</div>
            <div style="font-size: 1.5rem; margin: 0.5rem 0;">→</div>
            <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-success);">3+</div>
            <div style="font-size: var(--text-sm); color: var(--color-text-muted);">Simultaneous</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-primary);">Weeks</div>
            <div style="font-size: var(--text-sm); color: var(--color-text-muted);">Audit Preparation</div>
            <div style="font-size: 1.5rem; margin: 0.5rem 0;">→</div>
            <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-success);">Real-time</div>
            <div style="font-size: var(--text-sm); color: var(--color-text-muted);">Continuous</div>
          </div>
        </div>
      </div>

      <div class="about-grid">
        <div class="about-card">
          <div class="about-card-icon">🤖</div>
          <h3>AI Subagents</h3>
          <p>
            4 specialized agents handle complex analysis: <strong>Regulatory Analyst</strong> for
            multi-jurisdiction compliance, <strong>Risk Assessor</strong> for threat scoring,
            <strong>Audit Documenter</strong> for report generation, and <strong>Security Reviewer</strong>
            for privacy impact analysis.
          </p>
        </div>

        <div class="about-card">
          <div class="about-card-icon">⚡</div>
          <h3>Skills Framework</h3>
          <p>
            5 invocable skills orchestrate AI workflows: <code>/compliance-check</code>,
            <code>/audit-report</code>, <code>/risk-assess</code>, <code>/credential-verify</code>,
            and <code>/incident-respond</code>. Each skill coordinates tools and spawns specialized agents.
          </p>
        </div>

        <div class="about-card">
          <div class="about-card-icon">🔧</div>
          <h3>MCP Server</h3>
          <p>
            Custom Model Context Protocol server extends Claude's capabilities with 5 compliance tools
            (<code>regulatory_check</code>, <code>audit_log</code>, <code>risk_score</code>,
            <code>credential_validate</code>, <code>pii_detect</code>) and 2 resource providers.
          </p>
        </div>

        <div class="about-card">
          <div class="about-card-icon">🛡️</div>
          <h3>Intelligent Hooks</h3>
          <p>
            3 automated guardrails protect your codebase: <strong>PII Scanner</strong> blocks
            sensitive data writes, <strong>Audit Logger</strong> tracks all operations,
            <strong>Compliance Gate</strong> validates commits against security requirements.
          </p>
        </div>
      </div>

      <div class="about-section">
        <h3>🏗️ Architecture: How It Works</h3>
        <p>
          When you invoke a skill like <code>/compliance-check</code>, here's what happens:
        </p>

        <div style="background: var(--color-bg); padding: var(--space-6); border-radius: var(--radius-lg); margin: var(--space-4) 0; font-family: var(--font-mono); font-size: var(--text-sm); overflow-x: auto;">
          <pre style="margin: 0; color: var(--color-text-secondary);">
<span style="color: var(--color-primary);">1. SKILL INVOKED</span>
   User runs: /compliance-check src/services/user.ts

<span style="color: var(--color-primary);">2. MCP TOOLS EXECUTE</span>
   → pii_detect scans for sensitive data patterns
   → regulatory_check analyzes against GDPR, eIDAS, AML

<span style="color: var(--color-primary);">3. SUBAGENT SPAWNED</span>
   → Regulatory Analyst performs deep compliance review
   → Generates findings with specific remediation steps

<span style="color: var(--color-primary);">4. HOOKS FIRE</span>
   → audit_logger records the operation
   → Results logged to immutable audit trail

<span style="color: var(--color-primary);">5. REPORT GENERATED</span>
   → Structured compliance report returned
   → Findings mapped to specific regulation articles</pre>
        </div>
      </div>

      <div class="about-section">
        <h3>📁 Key Components</h3>
        <ul class="about-list">
          <li>
            <span class="about-list-icon">◆</span>
            <div class="about-list-content">
              <strong>.claude/skills/</strong>
              <span>5 skill definitions that orchestrate AI workflows — each skill can invoke MCP tools and spawn specialized subagents</span>
            </div>
          </li>
          <li>
            <span class="about-list-icon">◆</span>
            <div class="about-list-content">
              <strong>subagents/</strong>
              <span>4 AI specialist prompts with deep domain expertise in regulations, risk, audit, and security</span>
            </div>
          </li>
          <li>
            <span class="about-list-icon">◆</span>
            <div class="about-list-content">
              <strong>mcp-server/</strong>
              <span>TypeScript MCP server extending Claude with compliance-specific tools and real-time data resources</span>
            </div>
          </li>
          <li>
            <span class="about-list-icon">◆</span>
            <div class="about-list-content">
              <strong>hooks/</strong>
              <span>3 deterministic JavaScript hooks providing guardrails — PII detection, audit logging, commit validation</span>
            </div>
          </li>
          <li>
            <span class="about-list-icon">◆</span>
            <div class="about-list-content">
              <strong>CLAUDE.md</strong>
              <span>Project context file that provides Claude with regulatory framework knowledge and compliance standards</span>
            </div>
          </li>
        </ul>
      </div>

      <div class="about-section">
        <h3>🔐 Regulatory Frameworks</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--space-4); margin-top: var(--space-4);">
          <div style="background: var(--color-bg-tertiary); padding: var(--space-5); border-radius: var(--radius-lg); border-left: 3px solid var(--color-primary);">
            <strong style="color: var(--color-text); font-size: var(--text-lg);">GDPR</strong>
            <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-2); margin-bottom: var(--space-3);">
              EU General Data Protection Regulation
            </p>
            <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
              • Data protection principles<br>
              • Consent management<br>
              • Data subject rights<br>
              • Privacy by design
            </div>
          </div>
          <div style="background: var(--color-bg-tertiary); padding: var(--space-5); border-radius: var(--radius-lg); border-left: 3px solid var(--color-secondary);">
            <strong style="color: var(--color-text); font-size: var(--text-lg);">eIDAS 2.0</strong>
            <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-2); margin-bottom: var(--space-3);">
              EU Digital Identity Framework
            </p>
            <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
              • Digital identity wallets<br>
              • Qualified trust services<br>
              • Cross-border recognition<br>
              • Verifiable credentials
            </div>
          </div>
          <div style="background: var(--color-bg-tertiary); padding: var(--space-5); border-radius: var(--radius-lg); border-left: 3px solid var(--color-warning);">
            <strong style="color: var(--color-text); font-size: var(--text-lg);">AML/KYC</strong>
            <p style="font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-2); margin-bottom: var(--space-3);">
              Anti-Money Laundering & Know Your Customer
            </p>
            <div style="font-size: var(--text-xs); color: var(--color-text-muted);">
              • Customer due diligence<br>
              • Enhanced due diligence<br>
              • PEP & sanctions screening<br>
              • Transaction monitoring
            </div>
          </div>
        </div>
      </div>

      <div class="about-disclaimer">
        <span class="about-disclaimer-icon">⚠️</span>
        <div>
          <p>
            <strong>Synthetic Data Notice:</strong> This demo uses entirely synthetic/seed data
            for demonstration purposes. All customer records, credentials, and audit entries are
            fictional. "The Safe Company" is a fictional organization. No real personal data,
            proprietary information, or production systems are involved.
          </p>
        </div>
      </div>

      <div class="about-section" style="text-align: center; background: linear-gradient(135deg, var(--color-bg-tertiary), var(--color-bg-secondary)); margin-top: var(--space-8);">
        <h3 style="margin-bottom: var(--space-2);">Built by Daniel Ojeda</h3>
        <p style="color: var(--color-primary); font-weight: 500; margin-bottom: var(--space-6);">AI Enabler</p>
        <p style="max-width: 500px; margin: 0 auto var(--space-6); color: var(--color-text-secondary);">
          This project demonstrates how AI agents can transform complex enterprise workflows.
          The full source code showcases Claude Code's extensibility stack — skills, hooks,
          MCP servers, and subagents working together.
        </p>
        <div style="display: flex; justify-content: center; gap: var(--space-4); flex-wrap: wrap;">
          <a href="https://github.com/dojedaro/aegis" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="text-decoration: none;">
            View Source on GitHub
          </a>
          <a href="https://github.com/dojedaro" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="text-decoration: none;">
            More Projects
          </a>
        </div>
      </div>
    `;
  }
}
