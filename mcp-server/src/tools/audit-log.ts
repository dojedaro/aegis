import { readFileSync, appendFileSync, existsSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AUDIT_FILE = join(__dirname, "../../data/audit-trail.jsonl");

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  resource: string;
  details: Record<string, unknown>;
  result: "success" | "failure" | "pending";
  riskLevel?: "low" | "medium" | "high" | "critical";
  complianceRelevant: boolean;
}

interface AuditLogArgs {
  operation: "create" | "query";
  // For create operation
  action?: string;
  actor?: string;
  resource?: string;
  details?: Record<string, unknown>;
  result?: "success" | "failure" | "pending";
  riskLevel?: "low" | "medium" | "high" | "critical";
  complianceRelevant?: boolean;
  // For query operation
  filter?: {
    startDate?: string;
    endDate?: string;
    actor?: string;
    action?: string;
    riskLevel?: string;
    complianceRelevant?: boolean;
  };
  limit?: number;
}

interface AuditLogResult {
  success: boolean;
  operation: string;
  entry?: AuditEntry;
  entries?: AuditEntry[];
  count?: number;
  message?: string;
}

export const auditLogSchema = {
  type: "object" as const,
  properties: {
    operation: {
      type: "string",
      enum: ["create", "query"],
      description: "Operation to perform: 'create' to log a new entry, 'query' to retrieve entries",
    },
    action: {
      type: "string",
      description: "The action being logged (e.g., 'user_verification', 'data_access', 'config_change')",
    },
    actor: {
      type: "string",
      description: "Who performed the action (user ID, system component, or 'system')",
    },
    resource: {
      type: "string",
      description: "The resource affected (e.g., 'user:123', 'config:security', 'credential:abc')",
    },
    details: {
      type: "object",
      description: "Additional details about the action (key-value pairs)",
    },
    result: {
      type: "string",
      enum: ["success", "failure", "pending"],
      description: "Result of the action",
    },
    riskLevel: {
      type: "string",
      enum: ["low", "medium", "high", "critical"],
      description: "Risk level of the action",
    },
    complianceRelevant: {
      type: "boolean",
      description: "Whether this action is relevant for compliance audits",
    },
    filter: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "ISO date string for start of range" },
        endDate: { type: "string", description: "ISO date string for end of range" },
        actor: { type: "string", description: "Filter by actor" },
        action: { type: "string", description: "Filter by action type" },
        riskLevel: { type: "string", description: "Filter by risk level" },
        complianceRelevant: { type: "boolean", description: "Filter by compliance relevance" },
      },
      description: "Filters for query operation",
    },
    limit: {
      type: "number",
      description: "Maximum number of entries to return (default 100)",
    },
  },
  required: ["operation"],
};

function generateId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function ensureAuditFile(): void {
  if (!existsSync(AUDIT_FILE)) {
    writeFileSync(AUDIT_FILE, "");
  }
}

function readAuditEntries(): AuditEntry[] {
  ensureAuditFile();
  const content = readFileSync(AUDIT_FILE, "utf-8");
  if (!content.trim()) return [];

  return content
    .trim()
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as AuditEntry);
}

export async function auditLog(args: unknown): Promise<AuditLogResult> {
  const params = args as AuditLogArgs;

  if (params.operation === "create") {
    if (!params.action || !params.actor || !params.resource) {
      return {
        success: false,
        operation: "create",
        message: "Missing required fields: action, actor, and resource are required",
      };
    }

    const entry: AuditEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      action: params.action,
      actor: params.actor,
      resource: params.resource,
      details: params.details || {},
      result: params.result || "success",
      riskLevel: params.riskLevel,
      complianceRelevant: params.complianceRelevant ?? true,
    };

    ensureAuditFile();
    appendFileSync(AUDIT_FILE, JSON.stringify(entry) + "\n");

    return {
      success: true,
      operation: "create",
      entry,
      message: "Audit entry created successfully",
    };
  }

  if (params.operation === "query") {
    let entries = readAuditEntries();
    const filter = params.filter || {};

    // Apply filters
    if (filter.startDate) {
      const start = new Date(filter.startDate);
      entries = entries.filter((e) => new Date(e.timestamp) >= start);
    }
    if (filter.endDate) {
      const end = new Date(filter.endDate);
      entries = entries.filter((e) => new Date(e.timestamp) <= end);
    }
    if (filter.actor) {
      entries = entries.filter((e) => e.actor.includes(filter.actor!));
    }
    if (filter.action) {
      entries = entries.filter((e) => e.action.includes(filter.action!));
    }
    if (filter.riskLevel) {
      entries = entries.filter((e) => e.riskLevel === filter.riskLevel);
    }
    if (filter.complianceRelevant !== undefined) {
      entries = entries.filter((e) => e.complianceRelevant === filter.complianceRelevant);
    }

    // Sort by timestamp descending (most recent first)
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    const limit = params.limit || 100;
    entries = entries.slice(0, limit);

    return {
      success: true,
      operation: "query",
      entries,
      count: entries.length,
      message: `Retrieved ${entries.length} audit entries`,
    };
  }

  return {
    success: false,
    operation: params.operation,
    message: `Unknown operation: ${params.operation}`,
  };
}
