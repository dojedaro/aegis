import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { randomUUID } from "crypto";
import { z } from "zod";

import { appConfig } from "./config.js";
import { get } from "./db/schema.js";
import { ClaudeService } from "./services/claude.js";
import { RAGService } from "./services/rag.js";
import { ComplianceAgentService } from "./services/agent.js";
import { createAuditRouter } from "./routes/audit.js";
import { createAuthRouter } from "./routes/auth.js";
import { createComplianceRouter } from "./routes/compliance.js";
import { createRiskRouter } from "./routes/risk.js";
import { createCredentialsRouter } from "./routes/credentials.js";
import { createPIIRouter } from "./routes/pii.js";
import { createRegulationsRouter } from "./routes/regulations.js";
import { optionalAuth } from "./middleware/auth.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errors.js";
import { setupSwagger } from "./swagger.js";

export const APP_VERSION = "1.1.0";

const Framework = z.enum(["gdpr", "eidas", "aml", "eu-ai-act"]);

const AgentAnalyzeSchema = z.object({
  content: z.string().min(1).max(100_000),
  frameworks: z.array(Framework).min(1).default(["gdpr"]),
  target_type: z.enum(["file", "customer", "config", "process"]).default("config"),
});

const AgentRiskSchema = z.object({
  entity: z.string().min(1).max(500),
  entity_type: z.enum(["customer", "transaction", "process", "vendor"]).default("customer"),
  context: z.string().max(5000).optional(),
});

export interface Services {
  claudeService: ClaudeService;
  ragService: RAGService;
  agentService: ComplianceAgentService;
}

/** Build the Express app. Exported separately from startup so tests exercise the real stack. */
export function createApp({ claudeService, ragService, agentService }: Services): Express {
  // Create Express app
  const app = express();

  // Middleware
  app.use(helmet());
  app.use(cors({ origin: [...appConfig.corsOrigins], credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  // Request correlation ID for tracing
  app.use((req, res, next) => {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();
    res.setHeader("x-request-id", requestId);
    req.requestId = requestId;
    next();
  });

  // Request logging
  app.use(requestLogger);

  // Swagger API documentation
  setupSwagger(app);

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000"),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "100"),
    message: { error: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // AI endpoints spend money per call: a tighter per-IP budget on top of the global limit.
  const aiLimiter = rateLimit({
    windowMs: 60_000,
    max: parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE ?? "10", 10),
    message: { error: "Too many AI requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Optional auth - attaches user to request if token provided
  app.use(optionalAuth);

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service health status
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status: { type: string, example: healthy }
   *                 version: { type: string, example: "1.0.0" }
   *                 timestamp: { type: string, format: date-time }
   *                 ai_enabled: { type: boolean }
   */
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      ai_enabled: claudeService.isEnabled,
    });
  });

  /**
   * @swagger
   * /ready:
   *   get:
   *     summary: Kubernetes readiness probe
   *     description: Returns 200 when the service is ready to accept traffic
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is ready
   *       503:
   *         description: Service is not ready
   */
  app.get("/ready", (req, res) => {
    // Check if database is initialized
    try {
      const dbCheck = get("SELECT 1 as ok");
      if (dbCheck) {
        res.json({ ready: true, timestamp: new Date().toISOString() });
      } else {
        res.status(503).json({ ready: false, reason: "Database not available" });
      }
    } catch {
      res.status(503).json({ ready: false, reason: "Database check failed" });
    }
  });

  /**
   * @swagger
   * /live:
   *   get:
   *     summary: Kubernetes liveness probe
   *     description: Returns 200 if the service is alive (basic health)
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is alive
   */
  app.get("/live", (req, res) => {
    res.json({ alive: true, timestamp: new Date().toISOString() });
  });

  // API info
  app.get("/api", (req, res) => {
    res.json({
      name: "Aegis Compliance API",
      version: APP_VERSION,
      endpoints: {
        audit: "/api/audit",
        compliance: "/api/compliance",
        risk: "/api/risk",
        credentials: "/api/credentials",
        pii: "/api/pii",
        regulations: "/api/regulations",
      },
      ai_enabled: claudeService.isEnabled,
      documentation: "https://github.com/dojedaro/aegis",
    });
  });

  // Routes
  app.use("/api/auth", createAuthRouter());
  app.use("/api/audit", createAuditRouter());
  app.use("/api/compliance/check", aiLimiter);
  app.use("/api/compliance", createComplianceRouter(claudeService));
  app.use("/api/risk/assess", aiLimiter);
  app.use("/api/risk", createRiskRouter(claudeService));
  app.use("/api/credentials", createCredentialsRouter());
  app.use("/api/pii/scan", aiLimiter);
  app.use("/api/pii", createPIIRouter(claudeService));
  app.use("/api/regulations/query", aiLimiter);
  app.use("/api/regulations", createRegulationsRouter(ragService));
  app.use("/api/agent", aiLimiter);

  // AI usage stats
  app.get("/api/ai/usage", async (req, res) => {
    if (!claudeService.isEnabled) {
      return res.json({
        enabled: false,
        message: "AI features require ANTHROPIC_API_KEY environment variable",
      });
    }

    const stats = await claudeService.getUsageStats();
    res.json({
      enabled: true,
      usage: stats,
    });
  });

  /**
   * @swagger
   * /api/agent/analyze:
   *   post:
   *     summary: Agentic compliance analysis
   *     description: Multi-step AI analysis using tool-use for thorough compliance checking
   *     tags: [Compliance]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [content, frameworks]
   *             properties:
   *               content: { type: string, description: Content to analyze }
   *               frameworks: { type: array, items: { type: string } }
   *               target_type: { type: string, default: config }
   *     responses:
   *       200:
   *         description: Agentic analysis results
   */
  app.post("/api/agent/analyze", async (req, res) => {
    const { content, frameworks, target_type } = AgentAnalyzeSchema.parse(req.body);
    try {
      const result = await agentService.analyzeCompliance(content, frameworks, target_type);
      res.json({ ...result, agent_enabled: agentService.enabled });
    } catch (error) {
      console.error("Agent analysis failed:", error);
      res.status(502).json({ error: "AI analysis failed; please retry" });
    }
  });

  /**
   * @swagger
   * /api/agent/risk:
   *   post:
   *     summary: Agentic risk assessment
   *     description: AI-powered multi-factor risk analysis
   *     tags: [Risk]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [entity]
   *             properties:
   *               entity: { type: string }
   *               entity_type: { type: string, default: customer }
   *               context: { type: string }
   *     responses:
   *       200:
   *         description: Risk assessment results
   */
  app.post("/api/agent/risk", async (req, res) => {
    const { entity, entity_type, context } = AgentRiskSchema.parse(req.body);
    try {
      const result = await agentService.assessRisk(entity, entity_type, context);
      res.json({ ...result, agent_enabled: agentService.enabled });
    } catch (error) {
      console.error("Agent risk assessment failed:", error);
      res.status(502).json({ error: "AI assessment failed; please retry" });
    }
  });

  /**
   * @swagger
   * /metrics:
   *   get:
   *     summary: Application metrics
   *     description: Basic metrics for monitoring and observability
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Application metrics
   */
  app.get("/metrics", (req, res) => {
    const auditStats = get<{ total: number; today: number }>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN date(timestamp) = date('now') THEN 1 ELSE 0 END) as today
      FROM audit_entries`
    );
    const complianceStats = get<{ total: number; avg_score: number }>(
      `SELECT COUNT(*) as total, AVG(score) as avg_score FROM compliance_checks WHERE status = 'completed'`
    );

    res.json({
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      memory: {
        used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      database: {
        audit_entries_total: auditStats?.total ?? 0,
        audit_entries_today: auditStats?.today ?? 0,
        compliance_checks_total: complianceStats?.total ?? 0,
        compliance_avg_score: Math.round(complianceStats?.avg_score ?? 0),
      },
      ai: {
        enabled: claudeService.isEnabled,
      },
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: "Not found",
      path: req.path,
      request_id: req.requestId,
    });
  });

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
}
