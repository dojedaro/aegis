# /credential-verify - Verifiable Credential Validation

Validate W3C Verifiable Credentials for identity verification, document authenticity, and compliance with credential standards.

## Usage
```
/credential-verify <credential> [--options <options>]
```

## Arguments
- `credential` - JSON credential object or path to credential file
- `--options` - Validation options (checkExpiry, verifySignature, checkIssuerTrust, requiredTypes)

## Supported Credential Types
- **VerifiableCredential** - Base W3C VC type
- **IdentityCredential** - Identity verification credentials
- **AddressCredential** - Address verification
- **AgeVerificationCredential** - Age/DOB verification
- **EmploymentCredential** - Employment verification
- **EducationCredential** - Educational qualifications
- **FinancialCredential** - Financial status verification
- **KYCCredential** - KYC completion attestation

## Workflow

### Step 1: Parse Credential
Parse the input credential JSON and validate basic structure.

### Step 2: Validate Credential
Use the `credential_validate` MCP tool:
```json
{
  "credential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "IdentityCredential"],
    "issuer": "did:web:government.eu",
    "issuanceDate": "2024-01-01T00:00:00Z",
    "expirationDate": "2025-01-01T00:00:00Z",
    "credentialSubject": {
      "id": "did:key:z6Mk...",
      "givenName": "John",
      "familyName": "Doe"
    },
    "proof": {
      "type": "Ed25519Signature2020",
      "created": "2024-01-01T00:00:00Z",
      "verificationMethod": "did:web:government.eu#key-1",
      "proofPurpose": "assertionMethod",
      "proofValue": "..."
    }
  },
  "options": {
    "checkExpiry": true,
    "verifySignature": true,
    "checkIssuerTrust": true
  }
}
```

### Step 3: Compliance Mapping
Map credential validation to regulatory requirements:

**eIDAS 2.0**
- Qualified electronic attestation of attributes
- Cross-border recognition
- Selective disclosure support

**GDPR**
- Data minimization in credential claims
- Consent for credential issuance
- Right to revocation

**AML/KYC**
- Identity proofing level
- Document authenticity
- Issuer reliability

### Step 4: Generate Verification Report

```markdown
# Credential Verification Report

## Verification Summary

| Check | Status | Details |
|-------|--------|---------|
| Context | ✅ PASS | Valid W3C VC context |
| Type | ✅ PASS | VerifiableCredential, IdentityCredential |
| Issuance | ✅ PASS | Issued 2024-01-01 |
| Expiry | ✅ PASS | Valid until 2025-01-01 |
| Issuer | ✅ PASS | Trusted issuer: government.eu |
| Proof | ✅ PASS | Ed25519Signature2020 verified |
| Subject | ✅ PASS | Subject ID present |

## Overall Result: ✅ VALID

## Credential Details

### Credential Type
- VerifiableCredential
- IdentityCredential

### Issuer
- ID: `did:web:government.eu`
- Trust Status: Verified trusted issuer

### Subject Claims
| Claim | Value |
|-------|-------|
| id | did:key:z6Mk... |
| givenName | John |
| familyName | Doe |

### Validity Period
- Issued: 2024-01-01T00:00:00Z
- Expires: 2025-01-01T00:00:00Z
- Days Remaining: 351

### Proof Details
- Type: Ed25519Signature2020
- Created: 2024-01-01T00:00:00Z
- Method: did:web:government.eu#key-1
- Purpose: assertionMethod

## Compliance Assessment

### eIDAS 2.0
- ✅ Qualified attestation structure
- ✅ Cross-border recognition eligible
- ⚠️ Selective disclosure not verified

### GDPR
- ✅ Minimal claims present
- ℹ️ Consent status: Not embedded in credential

### AML/KYC
- ✅ Identity proofing: High assurance
- ✅ Issuer reliability: Government entity

## Warnings
[List any warnings]

## Recommendations
[List any recommendations]
```

### Step 5: Log Verification
Record verification in audit trail:
```json
{
  "operation": "create",
  "action": "credential_verification",
  "actor": "credential-verify-skill",
  "resource": "[credential subject id]",
  "details": {
    "credentialTypes": "[types]",
    "issuer": "[issuer]",
    "isValid": true,
    "checks": "[summary of checks]"
  },
  "result": "success",
  "complianceRelevant": true
}
```

## Example Usage

```
> /credential-verify ./credentials/identity-vc.json

Credential Verification
=======================

Parsing credential...
Running validation checks...

✅ Context: Valid W3C Verifiable Credentials context
✅ Type: VerifiableCredential, IdentityCredential
✅ Issuance: 2024-01-01 (valid date)
✅ Expiry: 2025-01-01 (351 days remaining)
✅ Issuer: did:web:government.eu (TRUSTED)
✅ Proof: Ed25519Signature2020 (verified)
✅ Subject: did:key:z6Mk... (present)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION RESULT: ✅ VALID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Credential Summary:
- Subject: John Doe
- Issuer: EU Government Identity Service
- Valid for: 351 more days

Compliance Status:
- eIDAS 2.0: Compliant
- GDPR: Minimal data, compliant
- AML/KYC: High assurance identity

Audit logged: audit_20240115_cred001
```

## Handling Invalid Credentials

When a credential fails validation:

```
> /credential-verify ./credentials/expired-vc.json

Credential Verification
=======================

✅ Context: Valid W3C Verifiable Credentials context
✅ Type: VerifiableCredential
✅ Issuance: 2023-01-01 (valid date)
❌ Expiry: 2023-12-31 (EXPIRED 15 days ago)
⚠️ Issuer: did:web:unknown.org (NOT IN TRUSTED LIST)
❌ Proof: Missing proof value

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION RESULT: ❌ INVALID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Errors:
1. Credential expired on 2023-12-31
2. Credential proof is missing required fields

Warnings:
1. Issuer not in trusted list - manual verification required

Recommendations:
1. Request updated credential from issuer
2. Verify issuer identity through alternative means
3. Do not accept for high-assurance operations
```
