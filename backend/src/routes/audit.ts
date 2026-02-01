import { Router } from "express";
import type { Database } from "better-sqlite3";
import { randomUUID } from "crypto";
import { z } from "zod";

const AuditEntrySchema = z.object({
  actor: z.string().min(1),
  action: z.string().min(1),
  resource: z.string().min(1),
  details: z.string().optional(),
  risk_level: z.enum(["low", "medium", "high", "critical"]),
  compliance_relevant: z.boolean().default(false),
});

export function createAuditRouter(db: Database): Router {
  const router = Router();

  // GET /api/audit - List audit entries
  router.get("/", (req, res) => {
    const { period = "week", filter = "all", page = "1", limit = "20" } = req.query;

    let dateFilter = "";
    const now = new Date();

    switch (period) {
      case "today":
        dateFilter = `AND date(timestamp) = date('now')`;
        break;
      case "week":
        dateFilter = `AND timestamp >= datetime('now', '-7 days')`;
        break;
      case "month":
        dateFilter = `AND timestamp >= datetime('now', '-30 days')`;
        break;
      default:
        dateFilter = "";
    }

    let typeFilter = "";
    switch (filter) {
      case "compliance":
        typeFilter = "AND compliance_relevant = 1";
        break;
      case "high-risk":
        typeFilter = "AND risk_level IN ('high', 'critical')";
        break;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total FROM audit_entries WHERE 1=1 ${dateFilter} ${typeFilter}
    `);
    const { total } = countStmt.get() as { total: number };

    const stmt = db.prepare(`
      SELECT * FROM audit_entries
      WHERE 1=1 ${dateFilter} ${typeFilter}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);

    const entries = stmt.all(parseInt(limit as string), offset);

    res.json({
      entries,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  });

  // POST /api/audit - Create audit entry
  router.post("/", (req, res) => {
    try {
      const data = AuditEntrySchema.parse(req.body);

      const stmt = db.prepare(`
        INSERT INTO audit_entries (id, timestamp, actor, action, resource, details, risk_level, compliance_relevant)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const id = randomUUID();
      const timestamp = new Date().toISOString();

      stmt.run(
        id,
        timestamp,
        data.actor,
        data.action,
        data.resource,
        data.details ?? null,
        data.risk_level,
        data.compliance_relevant ? 1 : 0
      );

      res.status(201).json({ id, timestamp, ...data });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        throw error;
      }
    }
  });

  // GET /api/audit/:id - Get single entry
  router.get("/:id", (req, res) => {
    const stmt = db.prepare("SELECT * FROM audit_entries WHERE id = ?");
    const entry = stmt.get(req.params.id);

    if (!entry) {
      return res.status(404).json({ error: "Audit entry not found" });
    }

    res.json(entry);
  });

  // GET /api/audit/export - Export audit trail
  router.get("/actions/export", (req, res) => {
    const { period = "month", format = "json" } = req.query;

    let dateFilter = "";
    switch (period) {
      case "week":
        dateFilter = `WHERE timestamp >= datetime('now', '-7 days')`;
        break;
      case "month":
        dateFilter = `WHERE timestamp >= datetime('now', '-30 days')`;
        break;
      case "quarter":
        dateFilter = `WHERE timestamp >= datetime('now', '-90 days')`;
        break;
      default:
        dateFilter = "";
    }

    const stmt = db.prepare(`SELECT * FROM audit_entries ${dateFilter} ORDER BY timestamp DESC`);
    const entries = stmt.all();

    if (format === "csv") {
      const headers = "id,timestamp,actor,action,resource,risk_level,compliance_relevant\n";
      const rows = entries
        .map((e: any) => `${e.id},${e.timestamp},${e.actor},${e.action},${e.resource},${e.risk_level},${e.compliance_relevant}`)
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=audit-export-${new Date().toISOString().split("T")[0]}.csv`);
      res.send(headers + rows);
    } else {
      res.json({
        exported_at: new Date().toISOString(),
        period,
        count: entries.length,
        entries,
      });
    }
  });

  return router;
}
