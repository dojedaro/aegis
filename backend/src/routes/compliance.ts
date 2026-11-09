import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { query, run, get } from "../db/schema.js";
import { ClaudeService, ResultSource } from "../services/claude.js";
import { PaginationSchema, pageParams, whereClause } from "./list-query.js";

const ComplianceListQuery = PaginationSchema.extend({
  status: z.enum(["pending", "running", "completed", "failed"]).optional(),
});

type Framework = "gdpr" | "eidas" | "aml" | "eu-ai-act";

const SAMPLE_RESULTS: Record<Framework, { score: number; findings: { id: string; severity: string; message: string }[] }> = {
  gdpr: { score: 92, findings: [] },
  eidas: { score: 87, findings: [{ id: "EIDAS-001", severity: "low", message: "Wallet integration pending" }] },
  aml: { score: 95, findings: [] },
  "eu-ai-act": { score: 78, findings: [{ id: "AI-001", severity: "medium", message: "Human oversight documentation needed" }] },
};

const ComplianceCheckSchema = z.object({
  target: z.string().min(1).max(500),
  target_type: z.enum(["file", "customer", "config", "process"]),
  frameworks: z.array(z.enum(["gdpr", "eidas", "aml", "eu-ai-act"])).min(1),
  content: z.string().max(100_000).optional(),
});

export function createComplianceRouter(claudeService: ClaudeService): Router {
  const router = Router();

  /**
   * @swagger
   * /api/compliance:
   *   get:
   *     summary: List compliance checks
   *     tags: [Compliance]
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [running, completed, failed]
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: List of compliance checks
   */
  router.get("/", (req, res) => {
    const { status, ...pagination } = ComplianceListQuery.parse(req.query);
    const where = whereClause({ status });

    const checks = query(
      `SELECT * FROM compliance_checks ${where.sql} ORDER BY started_at DESC LIMIT ? OFFSET ?`,
      [...where.params, ...pageParams(pagination)]
    );

    const parsed = checks.map((c: any) => ({
      ...c,
      frameworks: JSON.parse(c.frameworks),
      results: c.results ? JSON.parse(c.results) : null,
    }));

    res.json({ checks: parsed });
  });

  /**
   * @swagger
   * /api/compliance/check:
   *   post:
   *     summary: Run AI-powered compliance check
   *     description: Analyzes target against specified regulatory frameworks using Claude AI
   *     tags: [Compliance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [target, target_type, frameworks]
   *             properties:
   *               target: { type: string, description: Target identifier }
   *               target_type: { type: string, enum: [file, customer, config, process] }
   *               frameworks:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [gdpr, eidas, aml, eu-ai-act]
   *               content: { type: string, description: Content to analyze }
   *           example:
   *             target: "kyc-workflow.json"
   *             target_type: "config"
   *             frameworks: ["gdpr", "aml"]
   *             content: "{ 'verify_identity': true, 'store_documents': true }"
   *     responses:
   *       201:
   *         description: Compliance check completed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ComplianceResult'
   *       400:
   *         description: Validation error
   */
  router.post("/check", async (req, res) => {
    const data = ComplianceCheckSchema.parse(req.body);

    const id = randomUUID();
    const startedAt = new Date().toISOString();
    run(
      `INSERT INTO compliance_checks (id, target, target_type, frameworks, status, checked_by, started_at) VALUES (?, ?, ?, ?, 'running', 'api', ?)`,
      [id, data.target, data.target_type, JSON.stringify(data.frameworks), startedAt]
    );

    let results: unknown;
    let score: number;
    let source: ResultSource;

    if (data.content) {
      try {
        const analysis = await claudeService.analyzeCompliance(data.content, data.frameworks);
        ({ data: results, source } = analysis);
        score = Math.max(0, Math.min(100, analysis.data.score));
      } catch (error) {
        // Record the failure honestly instead of storing fabricated results.
        console.error("Compliance analysis failed:", error);
        run(`UPDATE compliance_checks SET status = 'failed', completed_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
        return res.status(502).json({ id, status: "failed", error: "AI analysis failed; please retry" });
      }
    } else {
      // No content supplied: return the illustrative dashboard sample, explicitly labeled.
      const sample = SAMPLE_RESULTS;
      results = sample;
      source = "demo";
      score = Math.round(data.frameworks.reduce((sum, f) => sum + sample[f].score, 0) / data.frameworks.length);
    }

    const completedAt = new Date().toISOString();
    run(`UPDATE compliance_checks SET status = 'completed', results = ?, score = ?, completed_at = ? WHERE id = ?`, [
      JSON.stringify(results),
      score,
      completedAt,
      id,
    ]);
    run(
      `INSERT INTO audit_entries (id, timestamp, actor, action, resource, risk_level, compliance_relevant) VALUES (?, ?, ?, 'compliance_check', ?, ?, 1)`,
      [randomUUID(), completedAt, req.user?.email ?? "anonymous", data.target, score < 80 ? "high" : score < 90 ? "medium" : "low"]
    );

    res.status(201).json({
      id,
      target: data.target,
      frameworks: data.frameworks,
      status: "completed",
      score,
      results,
      source,
      started_at: startedAt,
      completed_at: completedAt,
      ai_enabled: claudeService.isEnabled,
    });
  });

  // GET /api/compliance/:id - Get specific check
  router.get("/:id", (req, res) => {
    const check = get("SELECT * FROM compliance_checks WHERE id = ?", [req.params.id]) as any;

    if (!check) {
      return res.status(404).json({ error: "Compliance check not found" });
    }

    res.json({
      ...check,
      frameworks: JSON.parse(check.frameworks),
      results: check.results ? JSON.parse(check.results) : null,
    });
  });

  // GET /api/compliance/stats - Get compliance statistics
  router.get("/actions/stats", (req, res) => {
    const stats = get<any>(`
      SELECT
        COUNT(*) as total_checks,
        AVG(score) as avg_score,
        SUM(CASE WHEN score >= 90 THEN 1 ELSE 0 END) as passing,
        SUM(CASE WHEN score < 90 THEN 1 ELSE 0 END) as failing
      FROM compliance_checks
      WHERE status = 'completed'
    `);

    res.json({
      overview: {
        total_checks: stats?.total_checks ?? 0,
        average_score: Math.round(stats?.avg_score ?? 0),
        passing_rate: stats?.total_checks > 0 ? Math.round((stats.passing / stats.total_checks) * 100) : 0,
      },
      ai_enabled: claudeService.isEnabled,
    });
  });

  return router;
}
