import { initializeDatabase } from "./schema.js";
import { randomUUID } from "crypto";

const db = initializeDatabase();

console.log("Seeding database...");

// Seed audit entries
const auditEntries = [
  { actor: "system", action: "compliance_check", resource: "customer:C-12345", risk_level: "low", compliance_relevant: 1 },
  { actor: "analyst@safeco.com", action: "risk_assessment", resource: "customer:C-67890", risk_level: "high", compliance_relevant: 1 },
  { actor: "system", action: "pii_scan", resource: "file:src/services/user.ts", risk_level: "medium", compliance_relevant: 1 },
  { actor: "system", action: "credential_verify", resource: "credential:VC-001", risk_level: "low", compliance_relevant: 1 },
  { actor: "admin@safeco.com", action: "audit_export", resource: "audit:2024-Q4", risk_level: "low", compliance_relevant: 0 },
  { actor: "system", action: "compliance_check", resource: "config:api-gateway", risk_level: "medium", compliance_relevant: 1 },
  { actor: "reviewer@safeco.com", action: "risk_override", resource: "customer:C-11111", risk_level: "high", compliance_relevant: 1 },
  { actor: "system", action: "sanctions_screen", resource: "customer:C-22222", risk_level: "critical", compliance_relevant: 1 },
  { actor: "system", action: "document_verify", resource: "document:DOC-789", risk_level: "low", compliance_relevant: 1 },
  { actor: "compliance@safeco.com", action: "policy_update", resource: "policy:AML-001", risk_level: "medium", compliance_relevant: 1 },
];

const insertAudit = db.prepare(`
  INSERT INTO audit_entries (id, timestamp, actor, action, resource, risk_level, compliance_relevant)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date();
auditEntries.forEach((entry, i) => {
  const timestamp = new Date(now.getTime() - i * 3600000).toISOString(); // 1 hour apart
  insertAudit.run(randomUUID(), timestamp, entry.actor, entry.action, entry.resource, entry.risk_level, entry.compliance_relevant);
});

// Seed risk assessments
const riskAssessments = [
  {
    entity_id: "C-12345",
    entity_type: "customer",
    overall_score: 8,
    risk_level: "medium",
    factors: JSON.stringify([
      { name: "Geographic Risk", score: 2, max: 5 },
      { name: "Transaction Volume", score: 3, max: 5 },
      { name: "PEP Status", score: 1, max: 5 },
      { name: "Business Type", score: 2, max: 5 },
    ]),
    recommendations: JSON.stringify(["Standard monitoring", "Annual review"]),
    assessed_by: "system",
  },
  {
    entity_id: "C-67890",
    entity_type: "customer",
    overall_score: 18,
    risk_level: "high",
    factors: JSON.stringify([
      { name: "Geographic Risk", score: 5, max: 5 },
      { name: "Transaction Volume", score: 4, max: 5 },
      { name: "PEP Status", score: 4, max: 5 },
      { name: "Business Type", score: 5, max: 5 },
    ]),
    recommendations: JSON.stringify(["Enhanced Due Diligence", "Monthly review", "Senior approval required"]),
    assessed_by: "analyst@safeco.com",
  },
];

const insertRisk = db.prepare(`
  INSERT INTO risk_assessments (id, entity_id, entity_type, overall_score, risk_level, factors, recommendations, assessed_by, assessed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

riskAssessments.forEach((assessment) => {
  insertRisk.run(
    randomUUID(),
    assessment.entity_id,
    assessment.entity_type,
    assessment.overall_score,
    assessment.risk_level,
    assessment.factors,
    assessment.recommendations,
    assessment.assessed_by,
    new Date().toISOString()
  );
});

// Seed compliance checks
const complianceChecks = [
  {
    target: "customer:C-12345",
    target_type: "customer",
    frameworks: JSON.stringify(["gdpr", "aml"]),
    status: "completed",
    score: 92,
    results: JSON.stringify({
      gdpr: { score: 95, findings: [] },
      aml: { score: 89, findings: [{ id: "AML-001", severity: "medium", message: "CDD documentation incomplete" }] },
    }),
    checked_by: "system",
  },
];

const insertCompliance = db.prepare(`
  INSERT INTO compliance_checks (id, target, target_type, frameworks, status, score, results, checked_by, started_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

complianceChecks.forEach((check) => {
  const startedAt = new Date(now.getTime() - 300000).toISOString();
  insertCompliance.run(
    randomUUID(),
    check.target,
    check.target_type,
    check.frameworks,
    check.status,
    check.score,
    check.results,
    check.checked_by,
    startedAt,
    now.toISOString()
  );
});

console.log("Database seeded successfully!");
console.log(`- ${auditEntries.length} audit entries`);
console.log(`- ${riskAssessments.length} risk assessments`);
console.log(`- ${complianceChecks.length} compliance checks`);

db.close();
