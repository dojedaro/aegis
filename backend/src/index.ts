import { appConfig } from "./config.js";
import { initializeDatabase } from "./db/schema.js";
import { LLMClient } from "./services/llm.js";
import { ClaudeService } from "./services/claude.js";
import { RAGService } from "./services/rag.js";
import { ComplianceAgentService } from "./services/agent.js";
import { createApp } from "./app.js";

async function main() {
  await initializeDatabase();

  // One model client shared by all AI features; null means demo mode (no API key).
  const llm = LLMClient.fromApiKey(appConfig.ai.apiKey);
  const claudeService = new ClaudeService(llm, appConfig.ai.dailyRequestLimit);
  const ragService = new RAGService(llm);
  const agentService = new ComplianceAgentService(llm, ragService);

  const app = createApp({ claudeService, ragService, agentService });

  // Start server
  const PORT = appConfig.port;
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Aegis Compliance API                                     ║
║   ────────────────────                                     ║
║                                                            ║
║   Server: http://localhost:${PORT}                            ║
║   Docs:   http://localhost:${PORT}/api-docs                   ║
║                                                            ║
║   AI Features: ${claudeService.isEnabled ? "Enabled ✓" : "Disabled (set ANTHROPIC_API_KEY)"}              ║
║                                                            ║
║   Health & Observability:                                  ║
║   • GET  /health           - Health check                  ║
║   • GET  /ready            - K8s readiness probe           ║
║   • GET  /live             - K8s liveness probe            ║
║   • GET  /metrics          - Application metrics           ║
║   • GET  /api-docs         - Swagger UI                    ║
║                                                            ║
║   Core Endpoints:                                          ║
║   • POST /api/auth/login   - Get JWT token                 ║
║   • POST /api/compliance/check - Run compliance check      ║
║   • POST /api/risk/assess  - Run risk assessment           ║
║   • POST /api/pii/scan     - Scan for PII                  ║
║   • POST /api/regulations/query - RAG Q&A                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
  });
}

main().catch((error) => {
  console.error("Failed to start Aegis API:", error);
  process.exit(1);
});
