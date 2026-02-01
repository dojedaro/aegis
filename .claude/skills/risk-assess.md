# /risk-assess - Risk Scoring Workflow

Evaluate risk across multiple dimensions for entities, processes, or systems using a structured risk assessment methodology.

## Usage
```
/risk-assess <entity> [--type <type>] [--context <context>]
```

## Arguments
- `entity` - Entity identifier (customer ID, process name, system name)
- `--type` - Entity type: customer, transaction, process, system
- `--context` - Additional context: jurisdiction, industry, previous incidents

## Workflow

### Step 1: Gather Entity Information
Collect relevant data about the entity being assessed:
- For customers: onboarding data, transaction history, verification status
- For transactions: amount, parties, geography, frequency
- For processes: data flows, access points, dependencies
- For systems: integrations, data sensitivity, exposure

### Step 2: Identify Risk Factors
Determine applicable risk factors by category:

**Compliance Risk**
- Regulatory exposure
- Jurisdiction complexity
- Documentation gaps
- Audit findings

**Operational Risk**
- Process complexity
- Manual interventions
- Error rates
- Dependency chains

**Financial Risk**
- Transaction volumes
- Exposure amounts
- Concentration risk
- Fraud indicators

**Reputational Risk**
- Public exposure
- Customer impact
- Media attention
- Partner relationships

### Step 3: Score Risk Factors
Use the `risk_score` MCP tool:
```json
{
  "entityType": "[type]",
  "entityId": "[entity]",
  "factors": [
    {
      "name": "Regulatory Exposure",
      "category": "compliance",
      "likelihood": 3,
      "impact": 4,
      "description": "Multi-jurisdiction operations",
      "mitigations": ["Regulatory monitoring", "Local compliance officers"]
    }
  ],
  "context": {
    "jurisdiction": "[jurisdiction]",
    "industry": "[industry]",
    "previousIncidents": 0
  }
}
```

### Step 4: Deep Analysis
Spawn `risk-assessor` subagent for comprehensive evaluation:
```
Task: Provide detailed risk analysis and prioritized recommendations
Subagent: risk-assessor
Input:
  - Entity information
  - Risk scores from tool
  - Industry benchmarks
  - Regulatory requirements
```

### Step 5: Generate Risk Report

```markdown
# Risk Assessment Report

## Entity Information
- **Entity**: [identifier]
- **Type**: [customer/transaction/process/system]
- **Assessment Date**: [timestamp]
- **Assessor**: Aegis Risk Assessment

## Risk Summary

### Overall Risk Score: [score]/25
### Risk Level: [LOW/MEDIUM/HIGH/CRITICAL]

```
┌─────────────────────────────────────────────┐
│           RISK MATRIX                       │
│                                             │
│  Impact  5 │ ○ │ ○ │ ◐ │ ● │ ● │           │
│         4 │ ○ │ ◐ │ ◐ │ ● │ ● │           │
│         3 │ ○ │ ○ │ ◐ │ ◐ │ ● │           │
│         2 │ ○ │ ○ │ ○ │ ◐ │ ◐ │           │
│         1 │ ○ │ ○ │ ○ │ ○ │ ◐ │           │
│           └───┴───┴───┴───┴───┘           │
│             1   2   3   4   5              │
│                Likelihood                   │
│                                             │
│  ○ Low  ◐ Medium  ● High/Critical         │
└─────────────────────────────────────────────┘
```

## Risk Factors Detail

### Compliance Risks
| Factor | L | I | Score | Level | Mitigation |
|--------|---|---|-------|-------|------------|
| [name] | 3 | 4 | 12    | HIGH  | [action]   |

### Operational Risks
[Similar table]

### Financial Risks
[Similar table]

### Reputational Risks
[Similar table]

## Category Analysis
[Aggregated scores by category with trend indicators]

## Regulatory Implications
- [Requirement 1]: [Implication]
- [Requirement 2]: [Implication]

## Recommendations

### Immediate (Critical/High Risks)
1. [Action with owner and deadline]

### Short-term (Medium Risks)
1. [Action]

### Ongoing Monitoring
1. [Monitoring requirement]

## Risk Acceptance
For risks that cannot be fully mitigated:
- [ ] Risk acknowledged by: ____________
- [ ] Acceptance date: ____________
- [ ] Review date: ____________
```

### Step 6: Log Assessment
Record in audit trail:
```json
{
  "operation": "create",
  "action": "risk_assessment",
  "actor": "risk-assess-skill",
  "resource": "[entity identifier]",
  "details": {
    "entityType": "[type]",
    "overallScore": "[score]",
    "riskLevel": "[level]",
    "factorCount": "[count]"
  },
  "result": "success",
  "riskLevel": "[determined level]",
  "complianceRelevant": true
}
```

## Example

```
> /risk-assess customer:C-12345 --type customer --context "jurisdiction:EU, industry:fintech"

Risk Assessment
===============

Entity: customer:C-12345
Type: Customer
Context: EU jurisdiction, Fintech industry

Analyzing risk factors...

Risk Factors Identified:
1. [COMPLIANCE] Multi-jurisdiction operations - L:3 I:4 = 12 (HIGH)
2. [COMPLIANCE] PEP screening required - L:2 I:5 = 10 (HIGH)
3. [OPERATIONAL] Manual verification process - L:3 I:2 = 6 (MEDIUM)
4. [FINANCIAL] High transaction volume - L:4 I:3 = 12 (HIGH)

Overall Score: 14/25 (HIGH RISK)

Recommendations:
1. [IMMEDIATE] Apply Enhanced Due Diligence procedures
2. [IMMEDIATE] Complete PEP screening and document results
3. [SHORT-TERM] Automate verification workflow
4. [ONGOING] Monthly transaction monitoring

Regulatory Implications:
- AML: EDD required for high-risk customer
- GDPR: DPIA may be required for processing
- eIDAS: High-assurance identity verification needed

Assessment logged: audit_20240115_xyz789
```
