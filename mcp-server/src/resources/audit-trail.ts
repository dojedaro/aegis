import { readFileSync, existsSync } from "fs";
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

interface AuditTrailResource {
  summary: {
    totalEntries: number;
    dateRange: {
      earliest?: string;
      latest?: string;
    };
    byResult: Record<string, number>;
    byRiskLevel: Record<string, number>;
    complianceRelevantCount: number;
  };
  recentEntries: AuditEntry[];
  topActors: Array<{ actor: string; count: number }>;
  topActions: Array<{ action: string; count: number }>;
}

export async function getAuditTrailResource(): Promise<AuditTrailResource> {
  // Return empty resource if no audit file exists
  if (!existsSync(AUDIT_FILE)) {
    return {
      summary: {
        totalEntries: 0,
        dateRange: {},
        byResult: {},
        byRiskLevel: {},
        complianceRelevantCount: 0,
      },
      recentEntries: [],
      topActors: [],
      topActions: [],
    };
  }

  const content = readFileSync(AUDIT_FILE, "utf-8");
  if (!content.trim()) {
    return {
      summary: {
        totalEntries: 0,
        dateRange: {},
        byResult: {},
        byRiskLevel: {},
        complianceRelevantCount: 0,
      },
      recentEntries: [],
      topActors: [],
      topActions: [],
    };
  }

  const entries: AuditEntry[] = content
    .trim()
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as AuditEntry);

  // Sort by timestamp descending
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Calculate summary statistics
  const byResult: Record<string, number> = {};
  const byRiskLevel: Record<string, number> = {};
  const actorCounts: Record<string, number> = {};
  const actionCounts: Record<string, number> = {};
  let complianceRelevantCount = 0;

  for (const entry of entries) {
    byResult[entry.result] = (byResult[entry.result] || 0) + 1;

    if (entry.riskLevel) {
      byRiskLevel[entry.riskLevel] = (byRiskLevel[entry.riskLevel] || 0) + 1;
    }

    if (entry.complianceRelevant) {
      complianceRelevantCount++;
    }

    actorCounts[entry.actor] = (actorCounts[entry.actor] || 0) + 1;
    actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
  }

  // Get top actors and actions
  const topActors = Object.entries(actorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([actor, count]) => ({ actor, count }));

  const topActions = Object.entries(actionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([action, count]) => ({ action, count }));

  // Date range
  const timestamps = entries.map((e) => e.timestamp);
  const dateRange = {
    earliest: timestamps.length > 0 ? timestamps[timestamps.length - 1] : undefined,
    latest: timestamps.length > 0 ? timestamps[0] : undefined,
  };

  return {
    summary: {
      totalEntries: entries.length,
      dateRange,
      byResult,
      byRiskLevel,
      complianceRelevantCount,
    },
    recentEntries: entries.slice(0, 20), // Last 20 entries
    topActors,
    topActions,
  };
}
