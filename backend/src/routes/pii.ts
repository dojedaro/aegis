import { Router } from "express";
import { z } from "zod";
import { ClaudeService, PIIAnalysis } from "../services/claude.js";
import { PIIFinding, redactPII, scanPII } from "../services/pii-scanner.js";

const PIIScanSchema = z.object({
  content: z.string().min(1).max(100_000),
  context: z.enum(["code", "document", "message"]).default("code"),
});

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
    const data = PIIScanSchema.parse(req.body);
    const ruleBasedFindings = scanPII(data.content);

    // Optional AI pass: catches context-dependent PII the regexes miss (names, addresses).
    // The deterministic scan is always returned, even if the model call fails.
    let aiAnalysis: (PIIAnalysis & { source: string }) | null = null;
    let aiError: string | undefined;
    if (claudeService.isEnabled && data.content.length > 50) {
      try {
        const analysis = await claudeService.detectPII(data.content);
        aiAnalysis = { ...analysis.data, source: analysis.source };
      } catch (error) {
        aiError = "AI analysis unavailable; rule-based results only";
        console.error("PII AI analysis failed:", error);
      }
    }

    const hasHighRisk = ruleBasedFindings.some((f) => f.risk === "high");
    const hasPII = ruleBasedFindings.length > 0 || (aiAnalysis?.found ?? false);

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
      ai_analysis: aiAnalysis,
      ai_error: aiError,
      ai_enabled: claudeService.isEnabled,
      recommendations: generateRecommendations(ruleBasedFindings, data.context),
    });
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
    const data = PIIScanSchema.parse(req.body);
    const { redacted, redactions } = redactPII(data.content);

    res.json({
      original_length: data.content.length,
      redacted_length: redacted.length,
      redacted_content: redacted,
      redactions,
      total_redacted: redactions.reduce((sum, r) => sum + r.count, 0),
    });
  });

  return router;
}

function generateRecommendations(findings: PIIFinding[], context: string): string[] {
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
