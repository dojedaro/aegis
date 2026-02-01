# Aegis - AI-Powered Compliance Operations Platform

## Project Mission
Aegis is a compliance-first development platform designed to assist organizations in meeting regulatory requirements for KYC (Know Your Customer), AML (Anti-Money Laundering), eIDAS 2.0 (EU Digital Identity), and verifiable credentials management.

## Regulatory Frameworks

### eIDAS 2.0 (Electronic Identification and Trust Services)
- **Scope**: EU-wide framework for electronic identification and trust services
- **Key Requirements**:
  - Qualified electronic signatures and seals
  - Electronic timestamps
  - Electronic registered delivery services
  - Website authentication certificates
  - European Digital Identity Wallets (EUDIW)
- **Compliance Level**: High assurance identity verification required

### GDPR (General Data Protection Regulation)
- **Scope**: Data protection and privacy in the EU
- **Key Requirements**:
  - Lawful basis for processing personal data
  - Data minimization principle
  - Right to erasure (right to be forgotten)
  - Data portability
  - Privacy by design and default
  - Data Protection Impact Assessments (DPIA)
- **PII Categories**: Names, addresses, emails, phone numbers, national IDs, biometric data

### AML/KYC (Anti-Money Laundering / Know Your Customer)
- **Scope**: Financial crime prevention
- **Key Requirements**:
  - Customer Due Diligence (CDD)
  - Enhanced Due Diligence (EDD) for high-risk customers
  - Ongoing monitoring and transaction screening
  - Suspicious Activity Reports (SAR)
  - Politically Exposed Persons (PEP) screening
  - Sanctions list screening
- **Risk Categories**: Low, Medium, High, Prohibited

### EU AI Act (Artificial Intelligence Act)
- **Scope**: EU regulation on artificial intelligence systems
- **Key Requirements**:
  - Risk-based classification of AI systems (Unacceptable, High, Limited, Minimal)
  - Prohibited AI practices (social scoring, real-time biometric identification)
  - High-risk AI system requirements (Art. 6-51)
  - Human oversight obligations (Art. 14)
  - Transparency requirements (Art. 13)
  - Data governance and quality (Art. 10)
  - Technical documentation (Art. 11)
  - Conformity assessment procedures
- **Identity/KYC Relevance**:
  - Biometric identification systems are high-risk (Annex III)
  - Remote identity verification requires transparency
  - Automated decision-making needs human oversight
  - AI-assisted KYC must meet data quality standards

## Security Protocols

### Data Handling Rules
1. **Never store PII in code or logs** - Use redaction and tokenization
2. **Encrypt sensitive data at rest and in transit** - AES-256 minimum
3. **Implement access controls** - Role-based access (RBAC)
4. **Maintain audit trails** - Immutable logging for all operations
5. **Data retention policies** - Follow regulatory minimums

### Code Standards for Compliance-Sensitive Code
1. **Input validation** - Sanitize all external inputs
2. **Output encoding** - Prevent injection attacks
3. **Error handling** - Never expose sensitive data in errors
4. **Logging** - Structured logs without PII
5. **Authentication** - Multi-factor for sensitive operations

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Aegis Platform                           │
├─────────────────────────────────────────────────────────────┤
│  Skills          │  Hooks           │  Subagents            │
│  ────────────    │  ──────────      │  ────────────         │
│  /compliance     │  PII Scanner     │  Regulatory Analyst   │
│  /audit-report   │  Audit Logger    │  Risk Assessor        │
│  /risk-assess    │  Compliance Gate │  Audit Documenter     │
│  /credential     │                  │  Security Reviewer    │
│  /incident       │                  │                       │
├─────────────────────────────────────────────────────────────┤
│                    MCP Server                               │
│  ─────────────────────────────────────────────────────────  │
│  Tools: regulatory_check, audit_log, risk_score,           │
│         credential_validate, pii_detect                     │
│  Resources: regulations://frameworks, audit://trail         │
├─────────────────────────────────────────────────────────────┤
│  CLI Demo        │  Web Dashboard                           │
│  ────────────    │  ──────────────────────────              │
│  aegis check     │  Compliance Status Overview              │
│  aegis audit     │  Audit Trail Viewer                      │
│  aegis risk      │  Risk Matrix Visualization               │
│  aegis demo      │  Credential Verification                 │
└─────────────────────────────────────────────────────────────┘
```

## Tool Usage Guidelines

### When to Use Each Skill
- **`/compliance-check`** - Before merging code, after configuration changes
- **`/audit-report`** - For regulatory audits, quarterly reviews
- **`/risk-assess`** - New customer onboarding, periodic reviews
- **`/credential-verify`** - Document verification, identity proofing
- **`/incident-respond`** - Security incidents, compliance breaches

### MCP Tool Reference
| Tool | Use Case |
|------|----------|
| `regulatory_check` | Validate code/config against specific regulations |
| `audit_log` | Record compliance-relevant events |
| `risk_score` | Calculate risk levels for entities |
| `credential_validate` | Verify W3C Verifiable Credentials |
| `pii_detect` | Scan for personally identifiable information |

## Development Standards

### Commit Messages
- Include compliance impact: `[COMPLIANCE]` tag for compliance-affecting changes
- Reference regulations: `[GDPR]`, `[AML]`, `[eIDAS]`, `[EU-AI-ACT]` as applicable

### Code Review Checklist
- [ ] No hardcoded PII or credentials
- [ ] Audit logging for sensitive operations
- [ ] Input validation on external data
- [ ] Error messages don't leak sensitive info
- [ ] Data retention policies respected

### Testing Requirements
- Unit tests for all compliance logic
- Integration tests for audit trail integrity
- Security tests for PII detection

## Fictional Company Context
This project uses "The Safe Company" as a fictional organization for all examples and demonstrations. All customer data, credentials, and scenarios are synthetic and for demonstration purposes only.
