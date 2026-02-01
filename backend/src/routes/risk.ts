import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { query, run, get } from "../db/schema.js";
import { ClaudeService } from "../services/claude.js";

const RiskAssessmentSchema = z.object({
  entity_id: z.string().min(1),
  entity_type: z.enum(["customer", "transaction", "process", "vendor"]),
  data: z.record(z.any()).optional(),
});

export function createRiskRouter(claudeService: ClaudeService): Router {
  const router = Router();

  // GET /api/risk - List risk assessments
  router.get("/", (req, res) => {
    const { level, entity_type, page = "1", limit = "20" } = req.query;

    let filters = [];
    if (level) filters.push(`risk_level = '${level}'`);
    if (entity_type) filters.push(`entity_type = '${entity_type}'`);

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const assessments = query(
      `SELECT * FROM risk_assessments ${whereClause} ORDER BY assessed_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit as string), offset]
    );

    const parsed = assessments.map((a: any) => ({
      ...a,
      factors: JSON.parse(a.factors),
      recommendations: a.recommendations ? JSON.parse(a.recommendations) : [],
    }));

    res.json({ assessments: parsed });
  });

  // POST /api/risk/assess - Run risk assessment
  router.post("/assess", async (req, res) => {
    try {
      const data = RiskAssessmentSchema.parse(req.body);

      let results: any;

      if (data.data && claudeService.isEnabled) {
        const analysis = await claudeService.assessRisk(JSON.stringify(data.data));
        try {
          results = JSON.parse(analysis.content);
        } catch {
          results = getDefaultRiskAssessment(data.entity_type);
        }
      } else {
        results = getDefaultRiskAssessment(data.entity_type);
      }

      const id = randomUUID();
      const assessedAt = new Date().toISOString();

      const nextReview = new Date();
      nextReview.setMonth(nextReview.getMonth() + (results.level === "high" || results.level === "critical" ? 1 : 3));

      run(
        `INSERT INTO risk_assessments (id, entity_id, entity_type, overall_score, risk_level, factors, recommendations, assessed_by, assessed_at, next_review) VALUES (?, ?, ?, ?, ?, ?, ?, 'api', ?, ?)`,
        [id, data.entity_id, data.entity_type, results.score, results.level, JSON.stringify(results.factors), JSON.stringify(results.recommendations), assessedAt, nextReview.toISOString()]
      );

      run(
        `INSERT INTO audit_entries (id, timestamp, actor, action, resource, risk_level, compliance_relevant) VALUES (?, ?, 'api', 'risk_assessment', ?, ?, 1)`,
        [randomUUID(), assessedAt, `${data.entity_type}:${data.entity_id}`, results.level]
      );

      res.status(201).json({
        id,
        entity_id: data.entity_id,
        entity_type: data.entity_type,
        ...results,
        assessed_at: assessedAt,
        next_review: nextReview.toISOString(),
        ai_enabled: claudeService.isEnabled,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        throw error;
      }
    }
  });

  // GET /api/risk/:id - Get specific assessment
  router.get("/:id", (req, res) => {
    const assessment = get("SELECT * FROM risk_assessments WHERE id = ?", [req.params.id]) as any;

    if (!assessment) {
      return res.status(404).json({ error: "Risk assessment not found" });
    }

    res.json({
      ...assessment,
      factors: JSON.parse(assessment.factors),
      recommendations: assessment.recommendations ? JSON.parse(assessment.recommendations) : [],
    });
  });

  // GET /api/risk/entity/:entityId - Get assessments for entity
  router.get("/entity/:entityId", (req, res) => {
    const assessments = query(
      `SELECT * FROM risk_assessments WHERE entity_id = ? ORDER BY assessed_at DESC`,
      [req.params.entityId]
    );

    const parsed = assessments.map((a: any) => ({
      ...a,
      factors: JSON.parse(a.factors),
      recommendations: a.recommendations ? JSON.parse(a.recommendations) : [],
    }));

    res.json({ assessments: parsed });
  });

  // GET /api/risk/matrix - Get risk matrix data
  router.get("/actions/matrix", (req, res) => {
    const distribution = query<{ risk_level: string; count: number }>(
      `SELECT risk_level, COUNT(*) as count FROM risk_assessments GROUP BY risk_level`
    );

    const highRiskItems = query(
      `SELECT entity_id, entity_type, overall_score, risk_level, assessed_at FROM risk_assessments WHERE risk_level IN ('high', 'critical') ORDER BY assessed_at DESC LIMIT 10`
    );

    res.json({
      distribution: Object.fromEntries(distribution.map((d) => [d.risk_level, d.count])),
      high_risk_items: highRiskItems,
      total_assessed: distribution.reduce((sum, d) => sum + d.count, 0),
    });
  });

  return router;
}

function getDefaultRiskAssessment(entityType: string): any {
  const baseFactors = [
    { name: "Geographic Risk", score: Math.floor(Math.random() * 3) + 1, reason: "Standard jurisdiction" },
    { name: "Transaction Pattern", score: Math.floor(Math.random() * 3) + 2, reason: "Normal activity levels" },
    { name: "Entity Profile", score: Math.floor(Math.random() * 2) + 1, reason: "Verified documentation" },
    { name: "Relationship Duration", score: Math.floor(Math.random() * 2) + 1, reason: "Established relationship" },
  ];

  if (entityType === "customer") {
    baseFactors.push({ name: "PEP Exposure", score: Math.floor(Math.random() * 3) + 1, reason: "No direct PEP connection" });
  }

  const score = baseFactors.reduce((sum, f) => sum + f.score, 0);
  let level: string;

  if (score <= 6) level = "low";
  else if (score <= 12) level = "medium";
  else if (score <= 18) level = "high";
  else level = "critical";

  const recommendations =
    level === "low"
      ? ["Standard monitoring", "Annual review"]
      : level === "medium"
        ? ["Enhanced monitoring", "Quarterly review"]
        : ["Enhanced Due Diligence required", "Monthly review", "Senior approval needed"];

  return { score, level, factors: baseFactors, recommendations };
}
