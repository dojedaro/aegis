import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync, existsSync } from "fs";

import { initializeDatabase } from "./db/schema.js";
import { ClaudeService } from "./services/claude.js";
import { createAuditRouter } from "./routes/audit.js";
import { createComplianceRouter } from "./routes/compliance.js";
import { createRiskRouter } from "./routes/risk.js";
import { createCredentialsRouter } from "./routes/credentials.js";
import { createPIIRouter } from "./routes/pii.js";
import { createRegulationsRouter } from "./routes/regulations.js";
import { RAGService } from "./services/rag.js";

// Load environment variables
config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure data directory exists
const dataDir = join(__dirname, "../data");
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = initializeDatabase();

// Initialize Claude service
const claudeService = new ClaudeService(db, {
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxTokensPerRequest: parseInt(process.env.AI_MAX_TOKENS_PER_REQUEST ?? "1024"),
  dailyRequestLimit: parseInt(process.env.AI_DAILY_REQUEST_LIMIT ?? "1000"),
});

// Initialize RAG service for regulations
const ragService = new RAGService(db, process.env.ANTHROPIC_API_KEY);

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? ["https://aegis-web-xi.vercel.app"]
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000"),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? "100"),
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    ai_enabled: claudeService.isEnabled,
  });
});

// API info
app.get("/api", (req, res) => {
  res.json({
    name: "Aegis Compliance API",
    version: "1.0.0",
    endpoints: {
      audit: "/api/audit",
      compliance: "/api/compliance",
      risk: "/api/risk",
      credentials: "/api/credentials",
      pii: "/api/pii",
    },
    ai_enabled: claudeService.isEnabled,
    documentation: "https://github.com/dojedaro/aegis",
  });
});

// Routes
app.use("/api/audit", createAuditRouter(db));
app.use("/api/compliance", createComplianceRouter(db, claudeService));
app.use("/api/risk", createRiskRouter(db, claudeService));
app.use("/api/credentials", createCredentialsRouter(db));
app.use("/api/pii", createPIIRouter(claudeService));
app.use("/api/regulations", createRegulationsRouter(ragService));

// AI usage stats (protected in production)
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

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
const PORT = parseInt(process.env.PORT ?? "3001");
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Aegis Compliance API                                     ║
║   ────────────────────                                     ║
║                                                            ║
║   Server running on http://localhost:${PORT}                  ║
║                                                            ║
║   AI Features: ${claudeService.isEnabled ? "Enabled ✓" : "Disabled (set ANTHROPIC_API_KEY)"}              ║
║                                                            ║
║   Endpoints:                                               ║
║   • GET  /health           - Health check                  ║
║   • GET  /api              - API information               ║
║   • GET  /api/audit        - List audit entries            ║
║   • POST /api/audit        - Create audit entry            ║
║   • POST /api/compliance/check - Run compliance check      ║
║   • POST /api/risk/assess  - Run risk assessment           ║
║   • POST /api/credentials/verify - Verify credential       ║
║   • POST /api/pii/scan     - Scan for PII                  ║
║   • POST /api/regulations/query - RAG Q&A                  ║
║   • POST /api/regulations/search - Semantic search         ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  db.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Shutting down...");
  db.close();
  process.exit(0);
});
