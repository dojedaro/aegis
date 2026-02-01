// DataService - Simulates MCP server responses for the web dashboard
// In production, this would connect to the actual MCP server

import customersData from '../../../examples/sample-kyc-flow/customers.json';
import auditData from '../../../examples/sample-kyc-flow/audit-entries.json';
import credentialsData from '../../../examples/sample-kyc-flow/credentials.json';
import riskData from '../../../examples/sample-kyc-flow/risk-assessments.json';

export interface Customer {
  id: string;
  type: string;
  name: string;
  status: string;
  riskLevel: string;
  jurisdiction: string;
  nationality?: string;
  registrationCountry?: string;
  createdAt: string;
  verifiedAt?: string;
  cddLevel: string;
  pepStatus: string;
  sanctionsStatus: string;
  eddTriggers?: string[];
  beneficialOwners?: { name: string; ownership: number; verified: boolean }[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  target: string;
  result: string;
  frameworks?: string[];
  findings?: number;
  reason?: string;
  severity?: string;
  riskScore?: number;
  riskLevel?: string;
}

export interface Credential {
  id: string;
  type: string[];
  issuer: {
    id: string;
    name: string;
    country: string;
    trustLevel: string;
  };
  issuanceDate: string;
  expirationDate: string;
  credentialSubject: Record<string, unknown>;
  status: string;
  verificationResult: {
    signatureValid: boolean;
    issuerTrusted: boolean;
    notExpired: boolean;
    schemaValid: boolean;
  };
  eidasCompliance: {
    assuranceLevel: string;
    walletCompatible: boolean;
    crossBorderRecognition: boolean;
  };
  warnings?: string[];
}

export interface RiskAssessment {
  id: string;
  entityId: string;
  entityType: string;
  entityName: string;
  assessedAt: string;
  overallScore: number;
  maxScore: number;
  riskLevel: string;
  factors: {
    name: string;
    category: string;
    likelihood: number;
    impact: number;
    score: number;
    level: string;
    notes: string;
  }[];
  cddLevel: string;
  eddRequired: boolean;
  recommendations: string[];
  nextReviewDate: string;
}

export interface ComplianceStats {
  checksToday: number;
  openFindings: number;
  riskLevel: string;
  auditEvents: number;
  frameworks: {
    name: string;
    score: number;
  }[];
}

class DataService {
  private customers: Customer[];
  private auditEntries: AuditEntry[];
  private credentials: Credential[];
  private riskAssessments: RiskAssessment[];

  constructor() {
    this.customers = (customersData as { customers: Customer[] }).customers;
    this.auditEntries = (auditData as { auditEntries: AuditEntry[] }).auditEntries;
    this.credentials = (credentialsData as { credentials: Credential[] }).credentials;
    this.riskAssessments = (riskData as { riskAssessments: RiskAssessment[] }).riskAssessments;
  }

  // Simulate async API calls
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getComplianceStats(): Promise<ComplianceStats> {
    await this.delay(100);

    const highRiskCount = this.riskAssessments.filter(r => r.riskLevel === 'high').length;
    const openFindings = this.auditEntries.filter(a => a.result === 'needs_review' || a.result === 'potential_match').length;

    return {
      checksToday: 24,
      openFindings,
      riskLevel: highRiskCount > 1 ? 'High' : 'Medium',
      auditEvents: this.auditEntries.length * 13, // Simulate more entries
      frameworks: [
        { name: 'GDPR', score: 92 },
        { name: 'eIDAS 2.0', score: 87 },
        { name: 'AML/KYC', score: 95 }
      ]
    };
  }

  async getCustomers(): Promise<Customer[]> {
    await this.delay(50);
    return this.customers;
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    await this.delay(50);
    return this.customers.find(c => c.id === id);
  }

  async getAuditEntries(filter?: { period?: string; type?: string }): Promise<AuditEntry[]> {
    await this.delay(100);

    let entries = [...this.auditEntries];

    if (filter?.type === 'compliance') {
      entries = entries.filter(e => e.action.includes('compliance') || e.frameworks);
    } else if (filter?.type === 'high-risk') {
      entries = entries.filter(e => e.severity === 'critical' || e.riskLevel === 'high');
    }

    return entries;
  }

  async getCredentials(): Promise<Credential[]> {
    await this.delay(50);
    return this.credentials;
  }

  async verifyCredential(credentialId: string): Promise<{
    valid: boolean;
    credential: Credential | undefined;
    checks: { name: string; passed: boolean; message: string }[];
  }> {
    await this.delay(300);

    const credential = this.credentials.find(c => c.id === credentialId);

    if (!credential) {
      return {
        valid: false,
        credential: undefined,
        checks: [{ name: 'Credential Found', passed: false, message: 'Credential not found' }]
      };
    }

    const checks = [
      {
        name: 'Signature',
        passed: credential.verificationResult.signatureValid,
        message: credential.verificationResult.signatureValid ? 'Valid cryptographic signature' : 'Invalid signature'
      },
      {
        name: 'Issuer Trust',
        passed: credential.verificationResult.issuerTrusted,
        message: credential.verificationResult.issuerTrusted ? `Trusted issuer: ${credential.issuer.name}` : 'Issuer not in trust registry'
      },
      {
        name: 'Expiry',
        passed: credential.verificationResult.notExpired,
        message: credential.verificationResult.notExpired ? `Valid until ${credential.expirationDate}` : 'Credential expired'
      },
      {
        name: 'Schema',
        passed: credential.verificationResult.schemaValid,
        message: credential.verificationResult.schemaValid ? 'Valid credential schema' : 'Schema validation failed'
      },
      {
        name: 'eIDAS Compliance',
        passed: credential.eidasCompliance.assuranceLevel !== 'low',
        message: `Assurance level: ${credential.eidasCompliance.assuranceLevel}`
      }
    ];

    return {
      valid: checks.every(c => c.passed),
      credential,
      checks
    };
  }

  async getRiskAssessments(): Promise<RiskAssessment[]> {
    await this.delay(50);
    return this.riskAssessments;
  }

  async getRiskAssessment(entityId: string): Promise<RiskAssessment | undefined> {
    await this.delay(50);
    return this.riskAssessments.find(r => r.entityId === entityId);
  }

  async runComplianceCheck(target: string): Promise<{
    passed: boolean;
    frameworks: string[];
    findings: { id: string; severity: string; framework: string; message: string; recommendation: string }[];
    piiDetected: boolean;
  }> {
    await this.delay(500);

    // Simulate compliance check results
    const findings = [
      {
        id: 'GDPR-001',
        severity: 'medium',
        framework: 'GDPR',
        message: 'Data retention period not specified',
        recommendation: 'Add explicit retention period to data processing'
      },
      {
        id: 'AML-001',
        severity: 'high',
        framework: 'AML/KYC',
        message: 'Customer due diligence gap identified',
        recommendation: 'Ensure CDD is completed before processing'
      }
    ];

    return {
      passed: false,
      frameworks: ['GDPR', 'eIDAS 2.0', 'AML/KYC'],
      findings,
      piiDetected: false
    };
  }

  async calculateRiskScore(entityId: string): Promise<{
    score: number;
    maxScore: number;
    level: string;
    factors: { name: string; score: number; level: string }[];
    eddRequired: boolean;
  }> {
    await this.delay(300);

    const assessment = this.riskAssessments.find(r => r.entityId === entityId);

    if (assessment) {
      return {
        score: assessment.overallScore,
        maxScore: assessment.maxScore,
        level: assessment.riskLevel,
        factors: assessment.factors.map(f => ({
          name: f.name,
          score: f.score,
          level: f.level
        })),
        eddRequired: assessment.eddRequired
      };
    }

    // Default response for unknown entities
    return {
      score: 10,
      maxScore: 25,
      level: 'medium',
      factors: [
        { name: 'Default Risk', score: 10, level: 'medium' }
      ],
      eddRequired: false
    };
  }

  async getRecentActivity(): Promise<{ time: string; action: string; status: string }[]> {
    await this.delay(50);

    return this.auditEntries.slice(0, 5).map(entry => ({
      time: new Date(entry.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      action: entry.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      status: entry.result
    }));
  }
}

export const dataService = new DataService();
