import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { query, run, get } from "../db/schema.js";
import { requireRole } from "../middleware/auth.js";
import { PaginationSchema, pageParams } from "./list-query.js";

const AuditListQuery = PaginationSchema.extend({
  period: z.enum(["today", "week", "month", "all"]).default("week"),
  filter: z.enum(["all", "compliance", "high-risk"]).default("all"),
});

const AuditExportQuery = z.object({
  period: z.enum(["week", "month", "quarter", "all"]).default("month"),
  format: z.enum(["json", "csv"]).default("json"),
});

/**
 * Quote a CSV cell (RFC 4180) and neutralize spreadsheet formulas: audit fields contain
 * user-supplied text, and a cell starting with "=" would execute when opened in Excel.
 */
export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  const isFormula = /^[=+\-@\t\r]/.test(text);
  if (isFormula) text = `'${text}`;
  return isFormula || /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const AuditEntrySchema = z.object({
  action: z.string().min(1).max(100),
  resource: z.string().min(1).max(500),
  details: z.string().max(5000).optional(),
  risk_level: z.enum(["low", "medium", "high", "critical"]),
  compliance_relevant: z.boolean().default(false),
});

export function createAuditRouter(): Router {
  const router = Router();

  /**
   * @swagger
   * /api/audit:
   *   get:
   *     summary: List audit entries
   *     tags: [Audit]
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [today, week, month, all]
   *         description: Time period filter
   *       - in: query
   *         name: filter
   *         schema:
   *           type: string
   *           enum: [all, compliance, high-risk]
   *         description: Entry type filter
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
   *         description: Paginated list of audit entries
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 entries:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/AuditEntry'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page: { type: integer }
   *                     limit: { type: integer }
   *                     total: { type: integer }
   *                     pages: { type: integer }
   */
  router.get("/", (req, res) => {
    const { period, filter, page, limit } = AuditListQuery.parse(req.query);

    // Only fixed SQL fragments are interpolated; request values are enum-validated above.
    let dateFilter = "";
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

    const countResult = get<{ total: number }>(
      `SELECT COUNT(*) as total FROM audit_entries WHERE 1=1 ${dateFilter} ${typeFilter}`
    );
    const total = countResult?.total ?? 0;

    const entries = query(
      `SELECT * FROM audit_entries WHERE 1=1 ${dateFilter} ${typeFilter} ORDER BY timestamp DESC LIMIT ? OFFSET ?`,
      pageParams({ page, limit })
    );

    res.json({
      entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  });

  /**
   * @swagger
   * /api/audit:
   *   post:
   *     summary: Create audit entry
   *     tags: [Audit]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [action, resource, risk_level]
   *             properties:
   *               action: { type: string }
   *               resource: { type: string }
   *               details: { type: string }
   *               risk_level: { type: string, enum: [low, medium, high, critical] }
   *               compliance_relevant: { type: boolean }
   *     responses:
   *       201:
   *         description: Audit entry created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuditEntry'
   *       400:
   *         description: Validation error
   */
  router.post("/", requireRole("analyst", "admin"), (req, res) => {
    const data = AuditEntrySchema.parse(req.body);
    // The actor is the authenticated user, never a client-supplied name:
    // otherwise anyone could write evidence on someone else's behalf.
    const actor = req.user!.email;

    const id = randomUUID();
    const timestamp = new Date().toISOString();

    run(
      `INSERT INTO audit_entries (id, timestamp, actor, action, resource, details, risk_level, compliance_relevant) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, timestamp, actor, data.action, data.resource, data.details ?? null, data.risk_level, data.compliance_relevant ? 1 : 0]
    );

    res.status(201).json({ id, timestamp, actor, ...data });
  });

  /**
   * @swagger
   * /api/audit/{id}:
   *   get:
   *     summary: Get single audit entry
   *     tags: [Audit]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Audit entry details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuditEntry'
   *       404:
   *         description: Entry not found
   */
  router.get("/:id", (req, res) => {
    const entry = get("SELECT * FROM audit_entries WHERE id = ?", [req.params.id]);

    if (!entry) {
      return res.status(404).json({ error: "Audit entry not found" });
    }

    res.json(entry);
  });

  /**
   * @swagger
   * /api/audit/actions/export:
   *   get:
   *     summary: Export audit trail
   *     tags: [Audit]
   *     parameters:
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [week, month, quarter, all]
   *       - in: query
   *         name: format
   *         schema:
   *           type: string
   *           enum: [json, csv]
   *           default: json
   *     responses:
   *       200:
   *         description: Exported audit data
   */
  router.get("/actions/export", requireRole("analyst", "admin"), (req, res) => {
    const { period, format } = AuditExportQuery.parse(req.query);

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

    const entries = query(`SELECT * FROM audit_entries ${dateFilter} ORDER BY timestamp DESC`);

    if (format === "csv") {
      const columns = ["id", "timestamp", "actor", "action", "resource", "risk_level", "compliance_relevant"];
      const headers = columns.join(",") + "\n";
      const rows = entries.map((e: any) => columns.map((c) => csvCell(e[c])).join(",")).join("\n");

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
