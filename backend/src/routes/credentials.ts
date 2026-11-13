import { Router } from "express";
import { randomUUID } from "crypto";
import { z } from "zod";
import { query, run, get } from "../db/schema.js";
import { ApiError } from "../middleware/errors.js";
import { evaluateCredential } from "../services/credential-checks.js";
import { PaginationSchema, pageParams, whereClause } from "./list-query.js";

const CredentialListQuery = PaginationSchema.extend({
  status: z.enum(["valid", "expired", "revoked", "invalid"]).optional(),
  type: z.string().max(100).optional(),
});

const CredentialSchema = z.object({
  type: z.string().min(1),
  issuer: z.string().min(1),
  subject: z.string().min(1),
  issued_at: z.string(),
  expires_at: z.string().optional(),
  credential_data: z.record(z.any()).optional(),
});

interface CredentialRow {
  id: string;
  type: string;
  issuer: string;
  subject: string;
  status: string;
  verification_result: string | null;
  [column: string]: unknown;
}

export function createCredentialsRouter(): Router {
  const router = Router();

  // GET /api/credentials - List credentials
  router.get("/", (req, res) => {
    const { status, type, ...pagination } = CredentialListQuery.parse(req.query);
    const where = whereClause({ status, type });
    const credentials = query(
      `SELECT * FROM credentials ${where.sql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...where.params, ...pageParams(pagination)]
    );
    res.json({ credentials });
  });

  // POST /api/credentials/verify - Structural checks of a credential (signature not verified; see README)
  router.post("/verify", (req, res) => {
    const data = CredentialSchema.parse(req.body); // ZodError -> 400 via the central error handler
    const id = randomUUID();
    const now = new Date();
    const { status, checks } = evaluateCredential(data, now);

    run(
      `INSERT INTO credentials (id, type, issuer, subject, issued_at, expires_at, status, verification_result, verified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.type, data.issuer, data.subject, data.issued_at, data.expires_at ?? null, status, JSON.stringify(checks), now.toISOString()]
    );
    run(
      `INSERT INTO audit_entries (id, timestamp, actor, action, resource, risk_level, compliance_relevant) VALUES (?, ?, 'api', 'credential_verify', ?, ?, 1)`,
      [randomUUID(), now.toISOString(), `credential:${id}`, status === "valid" ? "low" : "high"]
    );

    res.status(201).json({
      id,
      type: data.type,
      issuer: data.issuer,
      subject: data.subject,
      status,
      signature_verified: false,
      checks,
      verified_at: now.toISOString(),
      eidas_mapping: {
        // An eIDAS assurance level can't be assigned to a credential whose signature wasn't verified.
        assurance_level: null,
        trust_framework: "eIDAS 2.0",
        note: "Assurance level not assessed: signature and issuer trust are not verified in this demo",
      },
    });
  });

  // GET /api/credentials/:id - Get specific credential
  router.get("/:id", (req, res) => {
    const credential = get<CredentialRow>("SELECT * FROM credentials WHERE id = ?", [req.params.id]);
    if (!credential) throw ApiError.notFound("Credential");
    res.json({
      ...credential,
      verification_result: credential.verification_result ? JSON.parse(credential.verification_result) : null,
    });
  });

  return router;
}
