import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Aegis Compliance API",
      version: "1.0.0",
      description: `
## AI-Powered Compliance Operations Platform

Aegis provides comprehensive compliance tools for KYC, AML, eIDAS 2.0, and GDPR requirements.

### Features
- **Compliance Checking**: AI-powered regulatory compliance analysis
- **Risk Assessment**: Multi-dimensional risk scoring
- **PII Detection**: Automatic detection of personally identifiable information
- **Audit Trail**: Immutable logging of all compliance-relevant operations
- **Credential Verification**: W3C Verifiable Credentials validation
- **RAG-powered Q&A**: Natural language queries about regulations

### Authentication
Most endpoints support optional authentication. Protected endpoints require a Bearer token.

Demo credentials:
- Email: \`demo@safeco.com\` / Password: \`demo\`
- Email: \`admin@safeco.com\` / Password: \`admin123\`
      `,
      contact: {
        name: "Aegis Support",
        url: "https://github.com/dojedaro/aegis",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
      {
        url: "https://aegis-backend.fly.dev",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            message: { type: "string" },
          },
        },
        AuditEntry: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            timestamp: { type: "string", format: "date-time" },
            actor: { type: "string" },
            action: { type: "string" },
            resource: { type: "string" },
            details: { type: "string" },
            risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
            compliance_relevant: { type: "boolean" },
          },
        },
        ComplianceResult: {
          type: "object",
          properties: {
            compliant: { type: "boolean" },
            score: { type: "number", minimum: 0, maximum: 100 },
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  regulation: { type: "string" },
                  requirement: { type: "string" },
                  status: { type: "string", enum: ["pass", "fail", "warning"] },
                  details: { type: "string" },
                },
              },
            },
            recommendations: { type: "array", items: { type: "string" } },
            ai_analysis: { type: "string" },
          },
        },
        RiskAssessment: {
          type: "object",
          properties: {
            entity: { type: "string" },
            overall_risk: { type: "string", enum: ["low", "medium", "high", "critical"] },
            score: { type: "number", minimum: 0, maximum: 100 },
            factors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  score: { type: "number" },
                  weight: { type: "number" },
                  details: { type: "string" },
                },
              },
            },
            recommendations: { type: "array", items: { type: "string" } },
          },
        },
        PIIResult: {
          type: "object",
          properties: {
            has_pii: { type: "boolean" },
            findings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  value: { type: "string" },
                  location: { type: "string" },
                  risk_level: { type: "string" },
                },
              },
            },
            redacted_content: { type: "string" },
            ai_analysis: { type: "string" },
          },
        },
        RegulationArticle: {
          type: "object",
          properties: {
            id: { type: "string" },
            framework: { type: "string" },
            title: { type: "string" },
            content: { type: "string" },
            requirements: { type: "array", items: { type: "string" } },
            relevance: { type: "number" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { type: "string", enum: ["admin", "analyst", "viewer"] },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 1 },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            user: { $ref: "#/components/schemas/User" },
            expiresIn: { type: "string" },
          },
        },
      },
    },
    tags: [
      { name: "Health", description: "Health check endpoints" },
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Audit", description: "Audit trail management" },
      { name: "Compliance", description: "Compliance checking operations" },
      { name: "Risk", description: "Risk assessment operations" },
      { name: "PII", description: "PII detection operations" },
      { name: "Regulations", description: "Regulatory knowledge base" },
      { name: "Credentials", description: "Verifiable credentials operations" },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/index.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  // Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Aegis API Documentation",
    })
  );

  // OpenAPI JSON spec
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
