# Aegis - AI-Powered Compliance Operations Platform

<div align="center">

![Aegis Logo](https://img.shields.io/badge/AEGIS-Compliance%20Platform-00d4aa?style=for-the-badge&logo=shield&logoColor=white)

**A comprehensive demonstration of Claude Code's extensibility features for enterprise compliance operations**

[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-4a9eff?style=flat-square)](https://claude.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat-square&logo=vercel)](https://aegis-web-xi.vercel.app/)

[**Live Demo**](https://aegis-web-xi.vercel.app/) • [Features](#features) • [Quick Start](#quick-start) • [Architecture](#architecture) • [Documentation](#documentation)

</div>

---

## Overview

Aegis showcases how AI agents can transform regulatory compliance workflows. Built for KYC, AML, eIDAS 2.0, and verifiable credentials management, this project demonstrates mastery of Claude Code's full extensibility stack:

- **Skills** - Invocable workflows that orchestrate AI agents
- **MCP Server** - Custom tools extending Claude's capabilities
- **Hooks** - Deterministic guardrails for sensitive operations
- **Subagents** - Specialized AI agents for deep domain analysis

> **Note:** This is a demonstration project using synthetic data. "The Safe Company" is a fictional organization. No real personal data or proprietary information is used.

## Features

### Claude Code Integration

| Component | Count | Description |
|-----------|-------|-------------|
| **Skills** | 5 | Invocable compliance workflows |
| **MCP Tools** | 5 | Domain-specific compliance automation |
| **MCP Resources** | 2 | Real-time data providers |
| **Hooks** | 3 | Pre/post operation guardrails |
| **Subagents** | 4 | Specialized AI analysis agents |

### Compliance Capabilities

- **Regulatory Checking** - Analyze code against GDPR, eIDAS 2.0, AML/KYC
- **Risk Assessment** - Score entities using likelihood × impact matrix
- **Audit Trail** - Immutable logging for regulatory compliance
- **Credential Verification** - Validate W3C Verifiable Credentials
- **Incident Response** - Guided compliance incident workflows

### User Interfaces

- **CLI** - Interactive command-line demo with colorful output
- **Web Dashboard** - Professional compliance monitoring interface

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Claude Code CLI

### Installation

```bash
# Clone the repository
git clone https://github.com/dojedaro/aegis.git
cd aegis

# Install dependencies
npm install

# Build all packages
npm run build
```

### Running the Web Dashboard

```bash
cd web && npm run dev
# Open http://localhost:5173
```

### Running the CLI

```bash
# Interactive demo walkthrough
cd cli && npm run demo

# Run compliance check
npx aegis check ./src

# View audit trail
npx aegis audit

# Run risk assessment
npx aegis risk customer:C-12345
```

### Using Claude Code Skills

```bash
# Navigate to the aegis project
cd aegis

# Invoke skills
/compliance-check src/services/user.ts
/audit-report --period month
/risk-assess customer:C-12345
/credential-verify ./credentials/sample.json
/incident-respond --severity high --type data_breach
```

## Architecture

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

## Project Structure

```
aegis/
├── CLAUDE.md                     # Project context for Claude Code
├── .claude/
│   ├── settings.json             # Claude Code configuration
│   ├── skills/                   # 5 invocable skills
│   │   ├── compliance-check.md   # Regulatory analysis workflow
│   │   ├── audit-report.md       # Audit documentation generator
│   │   ├── risk-assess.md        # Risk scoring workflow
│   │   ├── credential-verify.md  # W3C VC validation
│   │   └── incident-respond.md   # Incident response workflow
│   └── hooks.json                # Hook definitions
│
├── hooks/
│   ├── pii-scanner.js            # Pre-edit PII detection
│   ├── audit-logger.js           # Post-tool audit logging
│   └── compliance-gate.js        # Pre-commit compliance check
│
├── mcp-server/                   # MCP server with tools & resources
│   ├── src/
│   │   ├── index.ts              # Server entry point
│   │   ├── tools/                # 5 compliance tools
│   │   └── resources/            # 2 resource providers
│   └── data/
│       └── regulations.json      # Regulatory requirements database
│
├── subagents/                    # 4 specialized agent prompts
│   ├── regulatory-analyst.md     # Multi-jurisdiction expert
│   ├── risk-assessor.md          # Risk evaluation specialist
│   ├── audit-documenter.md       # Documentation generator
│   └── security-reviewer.md      # Security & privacy reviewer
│
├── cli/                          # Interactive CLI demo
│   └── src/
│       ├── index.ts              # CLI entry point
│       └── commands/             # check, audit, risk, demo
│
├── web/                          # Web dashboard
│   └── src/
│       ├── main.ts               # Dashboard entry
│       └── components/           # UI components
│
└── examples/                     # Example workflows & data
```

## Documentation

### Skills Reference

| Skill | Command | Description |
|-------|---------|-------------|
| Compliance Check | `/compliance-check` | Analyze code/config for regulatory compliance |
| Audit Report | `/audit-report` | Generate audit-ready documentation |
| Risk Assessment | `/risk-assess` | Evaluate entity risk scores |
| Credential Verify | `/credential-verify` | Validate W3C Verifiable Credentials |
| Incident Response | `/incident-respond` | Guide compliance incident workflow |

### MCP Tools

| Tool | Description |
|------|-------------|
| `regulatory_check` | Check content against GDPR, eIDAS 2.0, AML/KYC |
| `audit_log` | Create and query audit trail entries |
| `risk_score` | Calculate risk scores for entities |
| `credential_validate` | Validate W3C VC format and signatures |
| `pii_detect` | Scan for PII patterns |

### Hooks

| Hook | Trigger | Purpose |
|------|---------|---------|
| `pii-scanner.js` | Pre-Edit/Write | Block PII in code |
| `audit-logger.js` | Post-Tool | Log all operations |
| `compliance-gate.js` | Pre-Commit | Validate compliance |

### Regulatory Frameworks

- **GDPR** - Data protection, consent, privacy by design
- **eIDAS 2.0** - Digital identity, qualified trust services
- **AML/KYC** - Customer due diligence, sanctions screening

## Example Scenarios

### Scenario 1: Compliance Check

```bash
$ aegis check src/services/user-verification.ts

✓ Analyzed 1 file(s)

Findings:
┌──────────┬──────────┬──────────┬─────────────────────────────┐
│ ID       │ Framework│ Severity │ Requirement                 │
├──────────┼──────────┼──────────┼─────────────────────────────┤
│ GDPR-004 │ GDPR     │ HIGH     │ Appropriate security meas...│
│ AML-001  │ AML/KYC  │ HIGH     │ Customer Due Diligence      │
└──────────┴──────────┴──────────┴─────────────────────────────┘

Overall Status: NEEDS REVIEW
```

### Scenario 2: Risk Assessment

```bash
$ aegis risk customer:C-12345 --type customer

Risk Assessment
===============
Overall Score: 14/25 (HIGH RISK)

Recommendations:
1. Apply Enhanced Due Diligence
2. Complete PEP screening
3. Monthly transaction monitoring
```

### Scenario 3: Credential Verification

```bash
$ /credential-verify ./credentials/identity-vc.json

✓ Context: Valid W3C VC
✓ Issuer: Trusted (government.eu)
✓ Signature: Ed25519 verified
✓ Expiry: Valid until 2025-06-15

Result: VALID
```

## Development

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build:mcp
npm run build:cli
npm run build:web
```

### Development Mode

```bash
# MCP server (watch mode)
cd mcp-server && npm run dev

# Web dashboard (hot reload)
cd web && npm run dev
```

## Tech Stack

- **TypeScript** - Type-safe implementation
- **MCP SDK** - Model Context Protocol server
- **Vite** - Web dashboard bundler
- **Commander** - CLI framework
- **Chalk/Ora** - Terminal styling

## License

MIT

---

<div align="center">

### Built by [Daniel Ojeda](https://github.com/dojedaro) | AI Enabler

*Demonstrating the power of AI-assisted development with Claude Code*

**The Safe Company** (fictional)

</div>
