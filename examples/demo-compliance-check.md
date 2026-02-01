# Aegis Compliance Check Demonstration

This document walks through a complete compliance check workflow using Aegis.

## Scenario

The Safe Company is reviewing a new user verification service before deployment. The service handles personal data and needs to comply with GDPR, eIDAS 2.0, and AML/KYC requirements.

## Step 1: Run the Compliance Check

### Using the CLI

```bash
$ aegis check src/services/user-verification.ts

╔═══════════════════════════════════════════════╗
║              AEGIS COMPLIANCE                 ║
║       AI-Powered Compliance Operations        ║
╚═══════════════════════════════════════════════╝

════════════════════════════════════════════════════════════
  Compliance Check
════════════════════════════════════════════════════════════

ℹ Frameworks: GDPR, EIDAS2, AML
ℹ Target: src/services/user-verification.ts

✓ Analyzed 1 file(s)

▸ PII Detection
──────────────────────────────────
✓ No PII detected

▸ Compliance Findings
──────────────────────────────────
⚠ Found 2 finding(s)

  Critical:    0
  High:        2
  Medium:      0

┌────────────┬────────────┬──────────┬──────────────┬──────────────────────────────┐
│ ID         │ Framework  │ Severity │ Status       │ Requirement                  │
├────────────┼────────────┼──────────┼──────────────┼──────────────────────────────┤
│ GDPR-004   │ GDPR       │ HIGH     │ NEEDS REVIEW │ Appropriate security meas... │
│ AML-001    │ AML/KYC    │ HIGH     │ NEEDS REVIEW │ Customer Due Diligence       │
└────────────┴────────────┴──────────┴──────────────┴──────────────────────────────┘

▸ Summary
──────────────────────────────────
┌──────────────────────────────────────────────┐
│ Compliance Check Complete                    │
├──────────────────────────────────────────────┤
│ Files Checked:    1                          │
│ PII Items:        0                          │
│ Findings:         2                          │
│ Overall Status:   NEEDS REVIEW               │
└──────────────────────────────────────────────┘

ℹ Run '/compliance-check' skill for detailed remediation guidance
```

### Using the Claude Code Skill

```
/compliance-check src/services/user-verification.ts
```

## Step 2: Review Detailed Findings

### Finding 1: GDPR-004 - Security Measures

**Status**: Needs Review
**Severity**: High
**Framework**: GDPR

**Details**:
The service handles personal data (user identifiers, verification status) but the code doesn't show explicit encryption or security control implementation.

**Remediation Steps**:
1. Implement encryption for personal data at rest (AES-256)
2. Use TLS 1.3 for data in transit
3. Add access control checks before data operations
4. Implement audit logging for all data access

**Code Example**:
```typescript
// Before
async function storeVerificationResult(userId: string, result: VerificationResult) {
  await db.save('verifications', { userId, ...result });
}

// After
async function storeVerificationResult(userId: string, result: VerificationResult) {
  // Encrypt sensitive data
  const encryptedResult = await encrypt(JSON.stringify(result));

  // Log access for audit trail
  await auditLog('verification_store', { userId, action: 'store' });

  // Store with access control
  await db.save('verifications', {
    userId,
    encryptedData: encryptedResult,
    accessLevel: 'restricted'
  });
}
```

### Finding 2: AML-001 - Customer Due Diligence

**Status**: Needs Review
**Severity**: High
**Framework**: AML/KYC

**Details**:
The verification service processes customer data but doesn't clearly implement the Customer Due Diligence workflow.

**Remediation Steps**:
1. Add explicit identity verification step
2. Implement document validation
3. Add PEP/sanctions screening integration
4. Record CDD completion in audit trail

**Code Example**:
```typescript
// Implement CDD workflow
async function performCDD(customer: Customer): Promise<CDDResult> {
  // Step 1: Identity verification
  const identityResult = await verifyIdentity(customer);
  if (!identityResult.verified) {
    throw new CDDError('Identity verification failed');
  }

  // Step 2: Document validation
  const documentResult = await validateDocuments(customer.documents);

  // Step 3: Screening
  const screeningResult = await performScreening(customer);

  // Step 4: Record in audit trail
  await auditLog('cdd_completed', {
    customerId: customer.id,
    level: screeningResult.eddRequired ? 'enhanced' : 'standard',
    timestamp: new Date().toISOString()
  });

  return {
    verified: true,
    cddLevel: screeningResult.eddRequired ? 'EDD' : 'CDD',
    completedAt: new Date()
  };
}
```

## Step 3: Generate Audit Report

After addressing the findings, generate an audit report:

```
/audit-report --period week --focus compliance
```

**Output**:
```markdown
# Compliance Audit Report

## Report Metadata
- Report ID: AUD-20240115-001
- Period: 2024-01-08 to 2024-01-15
- Scope: Compliance Events

## Summary
- Total Events: 47
- Compliance Relevant: 42
- High-Risk Events: 2

## Key Findings
1. Code review identified 2 compliance gaps (now remediated)
2. All verification operations properly logged
3. No PII detected in code or logs

## Recommendations
1. Continue quarterly compliance reviews
2. Consider automated compliance checks in CI/CD
```

## Step 4: Verify Remediation

Run the compliance check again after implementing fixes:

```bash
$ aegis check src/services/user-verification.ts

▸ Compliance Findings
──────────────────────────────────
✓ No compliance issues found

▸ Summary
──────────────────────────────────
┌──────────────────────────────────────────────┐
│ Compliance Check Complete                    │
├──────────────────────────────────────────────┤
│ Files Checked:    1                          │
│ PII Items:        0                          │
│ Findings:         0                          │
│ Overall Status:   COMPLIANT                  │
└──────────────────────────────────────────────┘
```

## Conclusion

The Aegis compliance check workflow:
1. Scans code for regulatory compliance gaps
2. Provides detailed findings with severity levels
3. Offers specific remediation guidance with code examples
4. Logs all operations to the audit trail
5. Generates audit-ready documentation

This systematic approach ensures consistent compliance across all code changes.
