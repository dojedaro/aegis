import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import ora from "ora";
import * as display from "../utils/display.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  resource: string;
  details: Record<string, unknown>;
  result: string;
  riskLevel?: string;
  complianceRelevant: boolean;
}

interface AuditOptions {
  period: string;
  actor?: string;
  risk?: string;
  limit: string;
}

function getAuditFilePath(): string {
  // Try multiple possible locations
  const possiblePaths = [
    join(__dirname, "../../../mcp-server/data/audit-trail.jsonl"),
    join(__dirname, "../../../../mcp-server/data/audit-trail.jsonl"),
    join(process.cwd(), "mcp-server/data/audit-trail.jsonl"),
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return p;
    }
  }

  return possiblePaths[0]; // Return first path even if doesn't exist
}

function parseAuditFile(filePath: string): AuditEntry[] {
  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, "utf-8");
  if (!content.trim()) {
    return [];
  }

  return content
    .trim()
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as AuditEntry);
}

function filterByPeriod(entries: AuditEntry[], period: string): AuditEntry[] {
  const now = new Date();
  let cutoff: Date;

  switch (period) {
    case "today":
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      return entries;
    default:
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return entries.filter((e) => new Date(e.timestamp) >= cutoff);
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleString();
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

export async function auditCommand(options: AuditOptions): Promise<void> {
  display.banner();
  display.header("Audit Trail");

  const spinner = ora("Loading audit trail...").start();

  const auditFile = getAuditFilePath();
  let entries = parseAuditFile(auditFile);

  if (entries.length === 0) {
    spinner.info("No audit entries found");
    console.log();
    display.info("Audit trail is empty. Operations will be logged as you use Aegis.");
    display.bullet("Run compliance checks to generate audit entries");
    display.bullet("Use the MCP tools to log custom audit events");
    return;
  }

  // Apply filters
  entries = filterByPeriod(entries, options.period);

  if (options.actor) {
    entries = entries.filter((e) => e.actor.toLowerCase().includes(options.actor!.toLowerCase()));
  }

  if (options.risk) {
    entries = entries.filter((e) => e.riskLevel === options.risk);
  }

  // Sort by timestamp descending
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Apply limit
  const limit = parseInt(options.limit, 10);
  const totalEntries = entries.length;
  entries = entries.slice(0, limit);

  spinner.succeed(`Loaded ${totalEntries} entries (showing ${entries.length})`);
  console.log();

  // Summary statistics
  display.subheader("Summary");

  const byResult: Record<string, number> = {};
  const byRiskLevel: Record<string, number> = {};
  const byActor: Record<string, number> = {};
  let complianceRelevant = 0;

  for (const e of entries) {
    byResult[e.result] = (byResult[e.result] || 0) + 1;
    if (e.riskLevel) {
      byRiskLevel[e.riskLevel] = (byRiskLevel[e.riskLevel] || 0) + 1;
    }
    byActor[e.actor] = (byActor[e.actor] || 0) + 1;
    if (e.complianceRelevant) complianceRelevant++;
  }

  display.keyValue("Period:", options.period);
  display.keyValue("Total Entries:", String(totalEntries));
  display.keyValue("Compliance Relevant:", String(complianceRelevant));
  console.log();

  // Results breakdown
  display.keyValue("By Result:", "");
  for (const [result, count] of Object.entries(byResult)) {
    const icon = result === "success" ? display.icons.check : result === "failure" ? display.icons.cross : display.icons.info;
    console.log(`    ${icon} ${result}: ${count}`);
  }

  // Risk breakdown
  if (Object.keys(byRiskLevel).length > 0) {
    console.log();
    display.keyValue("By Risk Level:", "");
    for (const level of ["critical", "high", "medium", "low"]) {
      if (byRiskLevel[level]) {
        console.log(`    ${display.riskLevel(level)}: ${byRiskLevel[level]}`);
      }
    }
  }

  // Top actors
  console.log();
  display.keyValue("Top Actors:", "");
  const sortedActors = Object.entries(byActor)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  for (const [actor, count] of sortedActors) {
    console.log(`    ${display.icons.bullet} ${actor}: ${count}`);
  }

  // Recent entries table
  display.subheader("Recent Entries");

  const table = display.createTable(["Time", "Action", "Actor", "Resource", "Result", "Risk"]);

  for (const entry of entries) {
    table.push([
      formatTimestamp(entry.timestamp),
      truncate(entry.action, 20),
      truncate(entry.actor, 15),
      truncate(entry.resource, 25),
      entry.result === "success"
        ? display.colors.success(entry.result)
        : entry.result === "failure"
          ? display.colors.error(entry.result)
          : entry.result,
      entry.riskLevel ? display.riskLevel(entry.riskLevel) : display.colors.muted("-"),
    ]);
  }

  console.log(table.toString());

  if (totalEntries > limit) {
    console.log();
    display.info(`Showing ${limit} of ${totalEntries} entries. Use --limit to see more.`);
  }

  // Export hint
  console.log();
  display.info("Run '/audit-report' skill for comprehensive audit documentation");
}
