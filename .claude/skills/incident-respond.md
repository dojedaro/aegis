# /incident-respond - Compliance Incident Response

Guide through compliance incident response process, create documentation, assess impact, and ensure proper regulatory notification.

## Usage
```
/incident-respond [--severity <severity>] [--type <type>]
```

## Arguments
- `--severity` - Initial severity: critical, high, medium, low
- `--type` - Incident type: data_breach, compliance_violation, security_incident, system_failure, fraud

## Incident Types

| Type | Description | Regulatory Implications |
|------|-------------|------------------------|
| data_breach | Unauthorized access to personal data | GDPR 72-hour notification |
| compliance_violation | Regulatory requirement breach | Framework-specific response |
| security_incident | Security control failure | Assess data impact |
| system_failure | System availability issue | Business continuity |
| fraud | Suspected fraudulent activity | AML SAR requirements |

## Workflow

### Phase 1: Incident Identification

**Gather Initial Information**
```
1. What happened? (Brief description)
2. When was it detected?
3. Who detected it?
4. What systems/data are affected?
5. Is the incident ongoing?
```

**Create Incident Record**
Log to audit trail with `audit_log` tool:
```json
{
  "operation": "create",
  "action": "incident_opened",
  "actor": "[reporter]",
  "resource": "incident:[generated-id]",
  "details": {
    "type": "[incident type]",
    "severity": "[severity]",
    "description": "[brief description]",
    "detectedAt": "[timestamp]",
    "status": "open"
  },
  "result": "pending",
  "riskLevel": "[severity]",
  "complianceRelevant": true
}
```

### Phase 2: Impact Assessment

**Spawn Security Reviewer**
```
Task: Assess incident impact across security and privacy dimensions
Subagent: security-reviewer
Input:
  - Incident details
  - Affected systems
  - Data categories potentially exposed
  - Timeline of events
```

**Data Impact Analysis**
- Personal data affected? (GDPR scope)
- Number of individuals affected?
- Categories of data (basic, sensitive, special)
- Geographic scope (EU, international)

**Regulatory Impact**
Use `regulatory_check` tool to assess compliance implications.

### Phase 3: Containment

**Immediate Actions Checklist**
```markdown
## Containment Checklist

### Immediate (0-1 hours)
- [ ] Isolate affected systems if needed
- [ ] Preserve evidence (logs, screenshots)
- [ ] Notify incident response team
- [ ] Assess ongoing risk

### Short-term (1-24 hours)
- [ ] Implement temporary controls
- [ ] Monitor for additional activity
- [ ] Begin root cause analysis
- [ ] Prepare stakeholder communication

### Evidence Preservation
- [ ] System logs exported
- [ ] Access logs preserved
- [ ] Timeline documented
- [ ] Screenshots captured
```

### Phase 4: Notification Assessment

**GDPR Notification Requirements**
```
72-Hour Supervisory Authority Notification Required If:
- Personal data breach occurred
- Likely to result in risk to individuals
- Not encrypted/pseudonymized

Individual Notification Required If:
- High risk to rights and freedoms
- Unless technical measures applied
- Unless disproportionate effort (public notice instead)
```

**AML Reporting Requirements**
```
SAR Filing Required If:
- Suspected money laundering
- Terrorist financing concerns
- Suspicious transaction patterns
- Customer risk indicators
```

### Phase 5: Documentation

**Generate Incident Report**

```markdown
# Compliance Incident Report

## Incident Summary
| Field | Value |
|-------|-------|
| Incident ID | INC-[YYYYMMDD]-[seq] |
| Reported | [timestamp] |
| Reporter | [name/role] |
| Severity | [CRITICAL/HIGH/MEDIUM/LOW] |
| Status | [OPEN/CONTAINED/RESOLVED/CLOSED] |
| Type | [incident type] |

## Description
[Detailed description of what occurred]

## Timeline
| Time | Event | Actor |
|------|-------|-------|
| [timestamp] | Incident detected | [who] |
| [timestamp] | Response initiated | [who] |
| [timestamp] | Containment achieved | [who] |

## Impact Assessment

### Systems Affected
- [System 1]: [Impact description]
- [System 2]: [Impact description]

### Data Affected
- **Personal Data**: Yes/No
- **Individuals Affected**: [count or estimate]
- **Data Categories**: [list]
- **Geographic Scope**: [regions]

### Risk Level
[Risk score and justification]

## Regulatory Implications

### GDPR
- Supervisory notification required: Yes/No
- Deadline: [72 hours from awareness]
- Individual notification required: Yes/No

### AML
- SAR required: Yes/No
- Other reporting: [specify]

### eIDAS
- Trust service impact: Yes/No
- Notification requirements: [specify]

## Response Actions

### Containment
1. [Action taken]

### Remediation
1. [Action planned/taken]

### Prevention
1. [Long-term fix]

## Notifications Made

| Stakeholder | Method | Date | Responsible |
|-------------|--------|------|-------------|
| [Regulator] | [email/form] | [date] | [name] |
| [Affected individuals] | [method] | [date] | [name] |

## Lessons Learned
[To be completed post-incident]

## Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Incident Lead | | | |
| DPO | | | |
| Legal | | | |

---
*Generated by Aegis Incident Response*
*Confidential - Handle according to incident classification*
```

### Phase 6: Resolution & Closure

**Closure Checklist**
```markdown
## Closure Criteria

### Technical
- [ ] Root cause identified
- [ ] Vulnerability remediated
- [ ] Controls verified effective
- [ ] Monitoring enhanced

### Compliance
- [ ] All notifications completed
- [ ] Regulatory requirements satisfied
- [ ] Documentation complete
- [ ] Evidence preserved per retention policy

### Business
- [ ] Stakeholders informed
- [ ] Lessons learned documented
- [ ] Process improvements identified
- [ ] Training needs assessed
```

**Final Audit Log**
```json
{
  "operation": "create",
  "action": "incident_closed",
  "actor": "[closer]",
  "resource": "incident:[id]",
  "details": {
    "resolution": "[description]",
    "rootCause": "[cause]",
    "lessonsLearned": "[summary]",
    "closedAt": "[timestamp]"
  },
  "result": "success",
  "complianceRelevant": true
}
```

## Example Session

```
> /incident-respond --severity high --type data_breach

Incident Response Initiated
===========================
Severity: HIGH
Type: Data Breach

Phase 1: Identification
-----------------------
Please provide incident details:

> Customer reported receiving someone else's statement

Creating incident record...
Incident ID: INC-20240115-001

Phase 2: Impact Assessment
--------------------------
Spawning security-reviewer for impact analysis...

Impact Assessment Results:
- Personal data exposed: Yes
- Individuals affected: 2
- Data categories: Financial statements, name, address
- Geographic scope: EU

GDPR Notification Assessment:
⚠️ 72-hour supervisory authority notification likely required
⚠️ Individual notification recommended (high risk)

Phase 3: Containment
--------------------
Immediate actions:
1. ✅ Identify affected records
2. ✅ Suspend automated statement generation
3. ⏳ Root cause investigation in progress

Phase 4: Documentation
----------------------
Generating incident report...
Report saved: INC-20240115-001-report.md

Next Steps:
1. Complete root cause analysis
2. Prepare supervisory authority notification (deadline: 2024-01-18)
3. Draft individual notification letters
4. Schedule post-incident review

Incident logged to audit trail.
```
