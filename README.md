# Aegis - AI-Powered Compliance Operations Platform

<div align="center">

![Aegis Logo](https://img.shields.io/badge/AEGIS-Compliance%20Platform-00d4aa?style=for-the-badge&logo=shield&logoColor=white)

**Transforming regulatory compliance with AI agents — from hours to seconds**

[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-4a9eff?style=flat-square)](https://claude.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat-square&logo=vercel)](https://aegis-web-xi.vercel.app/)

[**Live Demo**](https://aegis-web-xi.vercel.app/) • [Why This Matters](#-why-this-matters) • [Features](#features) • [Architecture](#architecture) • [Quick Start](#quick-start)

</div>

---

## 🎯 Why This Matters

### The Problem

Regulatory compliance is expensive and slow:
- **Manual reviews** take 4-8 hours per code change
- **Expert bottleneck** — limited compliance specialists available
- **Inconsistent coverage** — humans miss patterns across large codebases
- **Audit preparation** takes weeks of documentation gathering

### The Solution

Aegis demonstrates how **AI agents can automate compliance workflows**:

| Traditional Approach | With Aegis |
|---------------------|------------|
| 4-8 hours per review | **< 30 seconds** |
| Manual checklist verification | **Automated pattern analysis** |
| Reactive audit preparation | **Continuous compliance monitoring** |
| Single-framework expertise | **Multi-regulation coverage** (GDPR, eIDAS, AML) |

### How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  /compliance-   │────▶│  AI Orchestration │────▶│  Compliance     │
│     check       │     │                  │     │  Report         │
└─────────────────┘     │  • MCP Tools     │     └─────────────────┘
                        │  • Subagents     │
                        │  • Hooks         │
                        └──────────────────┘
```

**One command. Multiple AI agents. Comprehensive analysis.**

---

## ✨ Features

### AI Agent Architecture

| Component | Count | Purpose |
|-----------|-------|---------|
| **Skills** | 5 | Orchestrate complex compliance workflows |
| **MCP Tools** | 5 | Extend Claude with domain-specific capabilities |
| **Hooks** | 3 | Deterministic guardrails (PII blocking, audit logging) |
| **Subagents** | 4 | Specialized AI experts for deep analysis |

### Specialized AI Subagents

| Agent | Expertise |
|-------|-----------|
| **Regulatory Analyst** | Multi-jurisdiction compliance (GDPR, eIDAS, AML) |
| **Risk Assessor** | Likelihood × impact scoring, EDD recommendations |
| **Audit Documenter** | Audit-ready report generation |
| **Security Reviewer** | Privacy impact, vulnerability analysis |

### Compliance Capabilities

- **Regulatory Checking** — Analyze code against GDPR, eIDAS 2.0, AML/KYC
- **Risk Assessment** — Score entities using standard risk matrices
- **Audit Trail** — Immutable logging for regulatory evidence
- **Credential Verification** — Validate W3C Verifiable Credentials
- **Incident Response** — Guided compliance incident workflows
- **PII Protection** — Automatic detection and blocking of sensitive data

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interaction Layer                   │
│         CLI Commands  •  Web Dashboard  •  Skills           │
├─────────────────────────────────────────────────────────────┤
│                    AI Orchestration Layer                   │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│    │  Regulatory  │  │     Risk     │  │    Audit     │    │
│    │   Analyst    │  │   Assessor   │  │  Documenter  │    │
│    └──────────────┘  └──────────────┘  └──────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Tool & Hook Layer                        │
│    MCP Tools: regulatory_check, audit_log, risk_score      │
│    Hooks: pii_scanner, audit_logger, compliance_gate       │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                               │
│    Regulations DB  •  Audit Trail  •  Risk Matrix          │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Skills as orchestrators** — Each skill coordinates multiple tools and can spawn specialized subagents
2. **Hooks for guardrails** — Deterministic checks that run before/after AI operations
3. **MCP for extensibility** — Custom tools that give Claude domain-specific capabilities
4. **Subagents for expertise** — Deep domain knowledge encoded in specialized prompts

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Claude Code CLI

### Installation

```bash
git clone https://github.com/dojedaro/aegis.git
cd aegis
npm install
npm run build
```

### Try It Out

**Web Dashboard:**
```bash
cd web && npm run dev
# Open http://localhost:5173
```

**CLI Demo:**
```bash
cd cli && npm run demo
```

**Claude Code Skills:**
```bash
cd aegis

# Run compliance check
/compliance-check examples/sample-kyc-flow/customer-data.json

# Assess risk
/risk-assess customer:C-12345 --type customer

# Verify credential
/credential-verify ./examples/sample-kyc-flow/customer-data.json
```

---

## 📁 Project Structure

```
aegis/
├── .claude/
│   ├── skills/              # 5 invocable workflows
│   │   ├── compliance-check.md
│   │   ├── audit-report.md
│   │   ├── risk-assess.md
│   │   ├── credential-verify.md
│   │   └── incident-respond.md
│   └── hooks.json           # Hook definitions
│
├── hooks/
│   ├── pii-scanner.js       # Blocks PII before file writes
│   ├── audit-logger.js      # Logs all operations
│   └── compliance-gate.js   # Validates commits
│
├── mcp-server/
│   └── src/
│       ├── tools/           # 5 MCP tools
│       └── resources/       # 2 resource providers
│
├── subagents/               # 4 AI specialist prompts
│   ├── regulatory-analyst.md
│   ├── risk-assessor.md
│   ├── audit-documenter.md
│   └── security-reviewer.md
│
├── cli/                     # Interactive CLI
├── web/                     # Dashboard UI
└── examples/                # Sample data & workflows
```

---

## 🔧 Skills Reference

| Skill | Command | What It Does |
|-------|---------|--------------|
| **Compliance Check** | `/compliance-check <file>` | Scans for PII, analyzes against regulations, spawns Regulatory Analyst for deep review |
| **Audit Report** | `/audit-report --period month` | Queries audit trail, spawns Audit Documenter, generates formatted report |
| **Risk Assessment** | `/risk-assess <entity>` | Calculates risk scores, spawns Risk Assessor, provides EDD recommendations |
| **Credential Verify** | `/credential-verify <file>` | Validates W3C VCs, checks issuer trust, maps to eIDAS requirements |
| **Incident Response** | `/incident-respond --severity high` | Guides incident workflow, spawns Security Reviewer, generates documentation |

---

## 🛡️ Hooks (Automated Guardrails)

| Hook | Trigger | Action |
|------|---------|--------|
| **PII Scanner** | Before Edit/Write | Blocks SSN, credit cards, API keys — prevents accidental data exposure |
| **Audit Logger** | After all tools | Creates immutable audit trail for compliance evidence |
| **Compliance Gate** | Before git commit | Scans staged files for secrets, validates audit trail currency |

---

## 📊 Example Output

### Compliance Check
```
/compliance-check src/services/user.ts

✓ PII Scan: No sensitive data detected
✓ GDPR Analysis: 11/12 requirements met
⚠ AML-001: Customer Due Diligence needs verification

Spawning Regulatory Analyst for detailed review...

Findings:
┌──────────┬──────────┬─────────────────────────────────┐
│ ID       │ Severity │ Recommendation                  │
├──────────┼──────────┼─────────────────────────────────┤
│ AML-001  │ HIGH     │ Add explicit CDD step before    │
│          │          │ customer data processing        │
└──────────┴──────────┴─────────────────────────────────┘
```

### Risk Assessment
```
/risk-assess customer:C-12345 --type customer

Risk Factors:
• Cross-border transfers    L:4 × I:4 = 16 (HIGH)
• PEP exposure             L:2 × I:5 = 10 (HIGH)
• Transaction volume       L:3 × I:3 = 9  (MEDIUM)

Overall: 14/25 — HIGH RISK

Regulatory Implications:
→ AML: Apply Enhanced Due Diligence
→ Monitoring: Monthly transaction review required
```

---

## 📸 Screenshots

<div align="center">

### Compliance Dashboard
![Dashboard Overview](docs/screenshots/dashboard.png)
*Real-time compliance status across GDPR, eIDAS 2.0, and AML/KYC frameworks*

### Risk Matrix
![Risk Matrix](docs/screenshots/risk-matrix.png)
*Interactive likelihood × impact visualization with drill-down capabilities*

### Audit Trail
![Audit Trail](docs/screenshots/audit-trail.png)
*Immutable compliance event log with filtering and export*

### Credential Verification
![Credential Verification](docs/screenshots/credentials.png)
*W3C Verifiable Credential validation with eIDAS compliance mapping*

</div>

---

## 📁 Sample Data

The `examples/` folder contains realistic synthetic data for testing:

| File | Description |
|------|-------------|
| `customers.json` | 6 customer profiles (individuals & corporates) with varying risk levels |
| `audit-entries.json` | 12 audit trail entries covering all operation types |
| `credentials.json` | 5 W3C Verifiable Credentials (identity, address, education, employment) |
| `risk-assessments.json` | 4 complete risk assessments with factor breakdowns |
| `customer-data.json` | Full KYC flow example with documents and screening results |

---

## 🔗 Links

- **Live Demo:** https://aegis-web-xi.vercel.app/
- **GitHub:** https://github.com/dojedaro/aegis
- **LinkedIn:** https://www.linkedin.com/in/dojedaro

---

## 📝 Note on Data

This project uses **synthetic data** for demonstration. "The Safe Company" is fictional. No real personal data, proprietary information, or production systems are involved.

---

<div align="center">

### Built by [Daniel Ojeda](https://github.com/dojedaro)

**AI Enabler** — Transforming complex workflows with intelligent automation

[![GitHub](https://img.shields.io/badge/GitHub-dojedaro-181717?style=flat-square&logo=github)](https://github.com/dojedaro)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-dojedaro-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/dojedaro)

</div>
