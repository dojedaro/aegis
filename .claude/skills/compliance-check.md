# /compliance-check - Regulatory Compliance Analysis

Analyze code, configuration, or documents for regulatory compliance against eIDAS 2.0, GDPR, and AML/KYC requirements.

## Usage
```
/compliance-check [file_or_content] [--frameworks <frameworks>]
```

## Arguments
- `file_or_content` - Path to file or inline content to analyze
- `--frameworks` - Comma-separated list: gdpr, eidas2, aml (default: all)

## Workflow

### Step 1: Content Preparation
Read the target file or accept inline content. Determine content type (code, config, document).

### Step 2: PII Pre-Scan
Use the `pii_detect` MCP tool to scan for any PII patterns in the content before full analysis.

### Step 3: Regulatory Analysis
Use the `regulatory_check` MCP tool to analyze against selected frameworks:
- **GDPR**: Data protection, consent, security measures
- **eIDAS 2.0**: Identity verification, digital signatures, trust services
- **AML/KYC**: Customer due diligence, sanctions screening, monitoring

### Step 4: Deep Analysis (if issues found)
If non-compliant findings exist, spawn the `regulatory-analyst` subagent for detailed analysis:
```
Task: Analyze compliance gaps and provide remediation guidance
Subagent: regulatory-analyst
Input: Findings from regulatory_check tool
```

### Step 5: Generate Report
Compile findings into a structured compliance report:

```markdown
## Compliance Check Report

**Date**: [timestamp]
**Target**: [file/content description]
**Frameworks**: [checked frameworks]

### Summary
- Overall Status: [COMPLIANT / NON-COMPLIANT / NEEDS REVIEW]
- Critical Issues: [count]
- High Issues: [count]
- Medium Issues: [count]

### PII Detection
[Results from pii_detect]

### Findings by Framework
#### GDPR
[Detailed findings]

#### eIDAS 2.0
[Detailed findings]

#### AML/KYC
[Detailed findings]

### Remediation Recommendations
1. [Priority remediation steps]

### Next Steps
- [ ] Address critical findings
- [ ] Schedule compliance review
- [ ] Update documentation
```

### Step 6: Log Audit Entry
Use `audit_log` MCP tool to record the compliance check:
```json
{
  "operation": "create",
  "action": "compliance_check",
  "actor": "compliance-check-skill",
  "resource": "[target file/content]",
  "details": {
    "frameworks": "[checked frameworks]",
    "status": "[overall status]",
    "findingsCount": "[count]"
  },
  "result": "success",
  "complianceRelevant": true
}
```

## Example Output

```
Compliance Check Report
=======================

Date: 2024-01-15T10:30:00Z
Target: src/services/user-verification.ts
Frameworks: GDPR, eIDAS 2.0, AML/KYC

Summary
-------
Overall Status: NEEDS REVIEW
Critical Issues: 0
High Issues: 2
Medium Issues: 1

Findings
--------
[GDPR-002] HIGH - Data Minimization
  Status: needs_review
  Details: Data collection scope unclear - review for minimization
  Remediation: Audit data fields collected and document necessity

[AML-001] HIGH - Customer Due Diligence
  Status: needs_review
  Details: Customer handling detected - verify CDD is performed
  Remediation: Ensure identity verification before business relationship

[GDPR-004] MEDIUM - Security Measures
  Status: needs_review
  Details: Security measures require verification
  Remediation: Document encryption and access control implementations

Recommendations
---------------
1. Review data collection to ensure GDPR minimization
2. Document CDD process in customer onboarding flow
3. Add security controls documentation

Audit entry logged: audit_20240115_abc123
```
