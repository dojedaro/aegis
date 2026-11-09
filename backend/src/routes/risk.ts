import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { query, run, get } from "../db/schema.js";
import { ClaudeService, ResultSource, RiskAnalysis } from "../services/claude.js";
import { RuleBasedRisk, assessRiskByRules } from "../services/risk-rules.js";
import { PaginationSchema, pageParams, whereClause } from "./list-query.js";

const EntityType = z.enum(["customer", "transaction", "process", "vendor"]);

const RiskListQuery = PaginationSchema.extend({
  level: z.enum(["low", "medium", "high", "critical"]).optional(),
  entity_type: EntityType.optional(),
});

const RiskAssessmentSchema = z.object({
  entity_id: z.string().min(1).max(200),
  entity_type: EntityType,
  data: z
    .object({
      high_risk_jurisdiction: z.boolean().optional(),
      pep: z.boolean().optional(),
      sanctions_hit: z.boolean().optional(),
      adverse_media: z.boolean().optional(),
      relationship_years: z.number().min(0).max(200).optional(),
    })
    .passthrough()
    .optional(),
});

export function createRiskRouter(claudeService: ClaudeService): Router {
  const router = Router();

  // GET /api/risk - List risk assessments
  router.get("/", (req: Request, res: Response) => {
    const { level, entity_type, ...pagination } = RiskListQuery.parse(req.query);
    const where = whereClause({ risk_level: level, entity_type });

    const assessments = query(
      `SELECT * FROM risk_assessments ${where.sql} ORDER BY assessed_at DESC LIMIT ? OFFSET ?`,
      [...where.params, ...pageParams(pagination)]
    );

    const parsed = assessments.map((a: any) => ({
      ...a,
      factors: JSON.parse(a.factors),
      recommendations: a.recommendations ? JSON.parse(a.recommendations) : [],
    }));

    res.json({ assessments: parsed });
  });

  // POST /api/risk/assess - Run risk assessment
  /**
   * @swagger
   * /api/risk/assess:
   *   post:
   *     summary: Assess KYC/AML risk for an entity
   *     description: Deterministic rule-based scoring; refined by Claude when an API key is configured and `data` is given. The `source` field says which produced the result.
   *     tags: [Risk]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [entity_id, entity_type]
   *             properties:
   *               entity_id: { type: string }
   *               entity_type: { type: string, enum: [customer, transaction, process, vendor] }
   *               data:
   *                 type: object
   *                 properties:
   *                   high_risk_jurisdiction: { type: boolean }
   *                   pep: { type: boolean }
   *                   sanctions_hit: { type: boolean }
   *                   adverse_media: { type: boolean }
   *                   relationship_years: { type: number }
   *           example:
   *             entity_id: "C-1001"
   *             entity_type: "customer"
   *             data: { pep: true, relationship_years: 2 }
   *     responses:
   *       201:
   *         description: Risk assessment (score, level, factors, recommendations, source)
   *       400:
   *         description: Validation error
   */
  router.post("/assess", async (req: Request, res: Response) => {
    const data = RiskAssessmentSchema.parse(req.body);

    // Rules always run; AI (when configured and given data) refines them. Every response
    // states which one produced it.
    let results: RuleBasedRisk | RiskAnalysis = assessRiskByRules(data.entity_type, data.data);
    let source: ResultSource | "rules" = "rules";
    let aiError: string | undefined;
    if (data.data && claudeService.isEnabled) {
      try {
        const analysis = await claudeService.assessRisk(JSON.stringify({ entity_type: data.entity_type, ...data.data }));
        results = analysis.data;
        source = analysis.source;
      } catch (error) {
        console.error("AI risk assessment failed, using rule-based result:", error);
        aiError = "AI assessment unavailable; rule-based result returned";
      }
    }

    const id = randomUUID();
    const assessedAt = new Date().toISOString();
    const nextReview = new Date();
    nextReview.setMonth(nextReview.getMonth() + (results.level === "high" || results.level === "critical" ? 1 : 3));

    run(
      `INSERT INTO risk_assessments (id, entity_id, entity_type, overall_score, risk_level, factors, recommendations, assessed_by, assessed_at, next_review) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.entity_id, data.entity_type, results.score, results.level, JSON.stringify(results.factors), JSON.stringify(results.recommendations), source, assessedAt, nextReview.toISOString()]
    );
    run(
      `INSERT INTO audit_entries (id, timestamp, actor, action, resource, risk_level, compliance_relevant) VALUES (?, ?, ?, 'risk_assessment', ?, ?, 1)`,
      [randomUUID(), assessedAt, req.user?.email ?? "anonymous", `${data.entity_type}:${data.entity_id}`, results.level]
    );

    res.status(201).json({
      id,
      entity_id: data.entity_id,
      entity_type: data.entity_type,
      ...results,
      source,
      ai_error: aiError,
      assessed_at: assessedAt,
      next_review: nextReview.toISOString(),
      ai_enabled: claudeService.isEnabled,
    });
  });

  // GET /api/risk/:id - Get specific assessment
  router.get("/:id", (req: Request, res: Response) => {
    const assessment = get("SELECT * FROM risk_assessments WHERE id = ?", [req.params.id as string]) as any;

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
  router.get("/entity/:entityId", (req: Request, res: Response) => {
    const assessments = query(
      `SELECT * FROM risk_assessments WHERE entity_id = ? ORDER BY assessed_at DESC`,
      [req.params.entityId as string]
    );

    const parsed = assessments.map((a: any) => ({
      ...a,
      factors: JSON.parse(a.factors),
      recommendations: a.recommendations ? JSON.parse(a.recommendations) : [],
    }));

    res.json({ assessments: parsed });
  });

  // GET /api/risk/matrix - Get risk matrix data
  router.get("/actions/matrix", (req: Request, res: Response) => {
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
