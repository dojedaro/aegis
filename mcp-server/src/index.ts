#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { regulatoryCheck, regulatoryCheckSchema } from "./tools/regulatory-check.js";
import { auditLog, auditLogSchema } from "./tools/audit-log.js";
import { riskScore, riskScoreSchema } from "./tools/risk-score.js";
import { credentialValidate, credentialValidateSchema } from "./tools/credential-validate.js";
import { piiDetect, piiDetectSchema } from "./tools/pii-detect.js";
import { getRegulationsResource } from "./resources/regulations.js";
import { getAuditTrailResource } from "./resources/audit-trail.js";

const server = new Server(
  {
    name: "aegis-compliance",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "regulatory_check",
        description: "Check code or configuration against regulatory requirements (eIDAS 2.0, GDPR, AML/KYC). Returns compliance findings with severity levels and remediation guidance.",
        inputSchema: regulatoryCheckSchema,
      },
      {
        name: "audit_log",
        description: "Create or query audit trail entries. Supports logging compliance events and retrieving audit history for reporting.",
        inputSchema: auditLogSchema,
      },
      {
        name: "risk_score",
        description: "Calculate risk scores for entities or processes based on multiple risk factors. Returns risk level (low/medium/high/critical) with breakdown.",
        inputSchema: riskScoreSchema,
      },
      {
        name: "credential_validate",
        description: "Validate W3C Verifiable Credentials. Checks credential schema, signatures, expiry, and issuer trust.",
        inputSchema: credentialValidateSchema,
      },
      {
        name: "pii_detect",
        description: "Scan text or code for Personally Identifiable Information (PII) patterns. Detects SSN, credit cards, emails, phone numbers, passport numbers, and IBANs.",
        inputSchema: piiDetectSchema,
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "regulatory_check":
        return { content: [{ type: "text", text: JSON.stringify(await regulatoryCheck(args), null, 2) }] };
      case "audit_log":
        return { content: [{ type: "text", text: JSON.stringify(await auditLog(args), null, 2) }] };
      case "risk_score":
        return { content: [{ type: "text", text: JSON.stringify(await riskScore(args), null, 2) }] };
      case "credential_validate":
        return { content: [{ type: "text", text: JSON.stringify(await credentialValidate(args), null, 2) }] };
      case "pii_detect":
        return { content: [{ type: "text", text: JSON.stringify(await piiDetect(args), null, 2) }] };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { content: [{ type: "text", text: JSON.stringify({ error: errorMessage }) }] };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "regulations://frameworks",
        name: "Regulatory Frameworks",
        description: "List of regulatory frameworks (eIDAS 2.0, GDPR, AML/KYC) with requirements and controls",
        mimeType: "application/json",
      },
      {
        uri: "audit://trail",
        name: "Audit Trail",
        description: "Recent audit trail entries showing compliance-relevant operations",
        mimeType: "application/json",
      },
    ],
  };
});

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case "regulations://frameworks":
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(await getRegulationsResource(), null, 2) }] };
    case "audit://trail":
      return { contents: [{ uri, mimeType: "application/json", text: JSON.stringify(await getAuditTrailResource(), null, 2) }] };
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Aegis Compliance MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
