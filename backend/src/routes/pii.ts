import { Router } from "express";
import { z } from "zod";
import { ClaudeService } from "../services/claude.js";

const PIIScanSchema = z.object({
  content: z.string().min(1),
  context: z.enum(["code", "document", "message"]).default("code"),
});

// PII patterns for rule-based detection (used as fallback or in addition to AI)
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ssn: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
  credit_card: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ip_address: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
  api_key: /\b(sk|pk|api|key|token|secret|password)[-_]?[a-zA-Z0-9]{16,}\b/gi,
  passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
  iban: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
};

export function createPIIRouter(claudeService: ClaudeService): Router {
  const router = Router();

  /**
   * @swagger
   * /api/pii/scan:
   *   post:
   *     summary: Scan content for personally identifiable information
   *     description: Uses rule-based patterns and optional AI analysis to detect PII
   *     tags: [PII]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [content]
   *             properties:
   *               content: { type: string, description: Content to scan }
   *               context: { type: string, enum: [code, document, message], default: code }
   *           example:
   *             content: "Contact john@example.com or call 555-123-4567"
   *             context: "document"
   *     responses:
   *       200:
   *         description: PII scan results
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PIIResult'
   *       400:
   *         description: Validation error
   */
  router.post("/scan", async (req, res) => {
    try {
      const data = PIIScanSchema.parse(req.body);

      // Rule-based detection
      const ruleBasedFindings: { type: string; count: number; risk: string; samples: string[] }[] = [];

      for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
        const matches = data.content.match(pattern);
        if (matches && matches.length > 0) {
          const risk = ["ssn", "credit_card", "api_key", "passport"].includes(type) ? "high" : "medium";
          ruleBasedFindings.push({
            type,
            count: matches.length,
            risk,
            samples: matches.slice(0, 3).map((m) => maskPII(m, type)),
          });
        }
      }

      // AI-based detection (if enabled)
      let aiFindings: any = null;
      if (claudeService.isEnabled && data.content.length > 50) {
        const analysis = await claudeService.detectPII(data.content);
        try {
          aiFindings = JSON.parse(analysis.content);
        } catch {
          // AI response wasn't valid JSON, skip
        }
      }

      const hasHighRisk = ruleBasedFindings.some((f) => f.risk === "high");
      const hasPII = ruleBasedFindings.length > 0 || (aiFindings?.found ?? false);

      res.json({
        scanned: true,
        content_length: data.content.length,
        context: data.context,
        pii_detected: hasPII,
        risk_level: hasHighRisk ? "high" : hasPII ? "medium" : "low",
        rule_based: {
          findings: ruleBasedFindings,
          total_items: ruleBasedFindings.reduce((sum, f) => sum + f.count, 0),
        },
        ai_analysis: aiFindings,
        ai_enabled: claudeService.isEnabled,
        recommendations: generateRecommendations(ruleBasedFindings, data.context),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        throw error;
      }
    }
  });

  /**
   * @swagger
   * /api/pii/redact:
   *   post:
   *     summary: Redact PII from content
   *     description: Replaces detected PII with placeholder tokens
   *     tags: [PII]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [content]
   *             properties:
   *               content: { type: string }
   *               context: { type: string, enum: [code, document, message] }
   *     responses:
   *       200:
   *         description: Redacted content
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 redacted_content: { type: string }
   *                 redactions: { type: array, items: { type: object } }
   *                 total_redacted: { type: integer }
   */
  router.post("/redact", (req, res) => {
    try {
      const data = PIIScanSchema.parse(req.body);

      let redactedContent = data.content;
      const redactions: { type: string; count: number }[] = [];

      for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
        const matches = redactedContent.match(pattern);
        if (matches && matches.length > 0) {
          redactions.push({ type, count: matches.length });
          redactedContent = redactedContent.replace(pattern, `[REDACTED_${type.toUpperCase()}]`);
        }
      }

      res.json({
        original_length: data.content.length,
        redacted_length: redactedContent.length,
        redacted_content: redactedContent,
        redactions,
        total_redacted: redactions.reduce((sum, r) => sum + r.count, 0),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Validation failed", details: error.errors });
      } else {
        throw error;
      }
    }
  });

  return router;
}

function maskPII(value: string, type: string): string {
  if (type === "email") {
    const [local, domain] = value.split("@");
    return `${local[0]}***@${domain}`;
  }
  if (type === "phone" || type === "ssn" || type === "credit_card") {
    return value.slice(0, 2) + "*".repeat(value.length - 4) + value.slice(-2);
  }
  if (type === "api_key") {
    return value.slice(0, 4) + "..." + value.slice(-4);
  }
  return value.slice(0, 2) + "***" + value.slice(-2);
}

function generateRecommendations(findings: { type: string; risk: string }[], context: string): string[] {
  const recommendations: string[] = [];

  if (findings.length === 0) {
    return ["No PII detected - content appears safe"];
  }

  const highRiskTypes = findings.filter((f) => f.risk === "high").map((f) => f.type);

  if (highRiskTypes.includes("api_key")) {
    recommendations.push("CRITICAL: Remove API keys and use environment variables");
  }
  if (highRiskTypes.includes("ssn")) {
    recommendations.push("CRITICAL: SSN detected - must be tokenized or removed");
  }
  if (highRiskTypes.includes("credit_card")) {
    recommendations.push("CRITICAL: Credit card numbers must be tokenized (PCI-DSS requirement)");
  }

  if (findings.some((f) => f.type === "email")) {
    recommendations.push(context === "code" ? "Use placeholder emails in code (e.g., user@example.com)" : "Consider if email collection is necessary (GDPR minimization)");
  }

  if (findings.some((f) => f.type === "phone")) {
    recommendations.push("Phone numbers should be stored encrypted with access controls");
  }

  recommendations.push("Run PII scan in CI/CD pipeline to prevent accidental commits");

  return recommendations;
}
