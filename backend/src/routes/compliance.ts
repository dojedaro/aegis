import { Router } from "express";
import type { Database } from "better-sqlite3";
import { randomUUID } from "crypto";
import { z } from "zod";
import { ClaudeService } from "../services/claude.js";

const ComplianceCheckSchema = z.object({
  target: z.string().min(1),
  target_type: z.enum(["file", "customer", "config", "process"]),
  frameworks: z.array(z.enum(["gdpr", "eidas", "aml", "eu-ai-act"])).min(1),
  content: z.string().optional(), // Code or data to analyze
});

export function createComplianceRouter(db: Database, claudeService: ClaudeService): Router {
  const router = Router();

  // GET /api/compliance - List compliance checks
  router.get("/", (req, res) => {
    const { status, page = "1", limit = "20" } = req.query;

    let statusFilter = "";
    if (status) {
      statusFilter = `WHERE status = '${status}'`;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const stmt = db.prepare(`
      SELECT * FROM compliance_checks
      ${statusFilter}
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `);

    const checks = stmt.all(parseInt(limit as string), offset);

    // Parse JSON fields
    const parsed = checks.map((c: any) => ({
      ...c,
      frameworks: JSON.parse(c.frameworks),
      results: c.results ? JSON.parse(c.results) : null,
    }));

    res.json({ checks: parsed });
  });

  // POST /api/compliance/check - Run a compliance check
  router.post("/check", async (req, res) => {
    try {
      const data = ComplianceCheckSchema.parse(req.body);

      const id = randomUUID();
      const startedAt = new Date().toISOString();

      // Insert pending check
      const insertStmt = db.prepare(`
        INSERT INTO compliance_checks (id, target, target_type, frameworks, status, checked_by, started_at)
        VALUES (?, ?, ?, ?, 'running', 'api', ?)
      `);
      insertStmt.run(id, data.target, data.target_type, JSON.stringify(data.frameworks), startedAt);

      // Run AI analysis if content provided
      let results: any = {};
      let score = 100;

      if (data.content) {
        const analysis = await claudeService.analyzeCompliance(data.content, data.frameworks);
        try {
          const parsed = JSON.parse(analysis.content);
          results = parsed;
          score = parsed.score ?? 100;
        } catch {
          results = { raw: analysis.content, cached: analysis.cached };
        }
      } else {
        // Demo results
        results = {
          gdpr: { score: 92, findings: [] },
          eidas: { score: 87, findings: [{ id: "EIDAS-001", severity: "low", message: "Wallet integration pending" }] },
          aml: { score: 95, findings: [] },
          "eu-ai-act": { score: 78, findings: [{ id: "AI-001", severity: "medium", message: "Human oversight documentation needed" }] },
        };
        score = Math.round(
          data.frameworks.reduce((sum, f) => sum + (results[f]?.score ?? 100), 0) / data.frameworks.length
        );
      }

      // Update with results
      const updateStmt = db.prepare(`
        UPDATE compliance_checks
        SET status = 'completed', results = ?, score = ?, completed_at = ?
        WHERE id = ?
      `);
      updateStmt.run(JSON.stringify(results), score, new Date().toISOString(), id);

      // Log to audit trail
      const auditStmt = db.prepare(`
        INSERT INTO audit_entries (id, timestamp, actor, action, resource, risk_level, compliance_relevant)
        VALUES (?, ?, 'api', 'compliance_check', ?, ?, 1)
      `);
      auditStmt.run(
        randomUUID(),
        new Date().toISOString(),
        data.target,
        score < 80 ? "high" : score < 90 ? "medium" : "low"
      );

      res.status(201).json({
        id,
        target: data.target,
        frameworks: data.frameworks,
        status: "completed",
        score,
        results,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
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

  // GET /api/compliance/:id - Get specific check
  router.get("/:id", (req, res) => {
    const stmt = db.prepare("SELECT * FROM compliance_checks WHERE id = ?");
    const check = stmt.get(req.params.id) as any;

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
    const statsStmt = db.prepare(`
      SELECT
        COUNT(*) as total_checks,
        AVG(score) as avg_score,
        SUM(CASE WHEN score >= 90 THEN 1 ELSE 0 END) as passing,
        SUM(CASE WHEN score < 90 THEN 1 ELSE 0 END) as failing
      FROM compliance_checks
      WHERE status = 'completed'
    `);

    const stats = statsStmt.get() as any;

    const frameworkStmt = db.prepare(`
      SELECT frameworks, AVG(score) as avg_score, COUNT(*) as count
      FROM compliance_checks
      WHERE status = 'completed'
      GROUP BY frameworks
    `);

    res.json({
      overview: {
        total_checks: stats.total_checks,
        average_score: Math.round(stats.avg_score ?? 0),
        passing_rate: stats.total_checks > 0 ? Math.round((stats.passing / stats.total_checks) * 100) : 0,
      },
      ai_enabled: claudeService.isEnabled,
    });
  });

  return router;
}
