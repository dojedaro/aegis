/**
 * Evaluate the compliance agent on documents with planted violations.
 *
 * Each case lists the violations planted in it and the article ids that correctly identify each one.
 * Scoring is done in code: a planted violation is "found" if any finding cites one of its accepted
 * articles; findings citing other articles are counted as off-target; any finding on a clean control
 * case is a false alarm.
 *
 * Usage: ANTHROPIC_API_KEY=... npx tsx scripts/eval-agent.ts [label]
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { LLMClient } from "../src/services/llm.js";
import { RAGService } from "../src/services/rag.js";
import { ComplianceAgentService, type Finding } from "../src/services/agent.js";

interface Planted {
  label: string;
  accept: string[];
}
interface Case {
  id: string;
  frameworks: string[];
  target_type: string;
  content: string;
  planted: Planted[];
}

const cases: Case[] = JSON.parse(readFileSync(new URL("../eval/cases.json", import.meta.url), "utf-8"));
const llm = LLMClient.fromApiKey(process.env.ANTHROPIC_API_KEY);
if (!llm) {
  console.error("ANTHROPIC_API_KEY is not set");
  process.exit(1);
}
const agent = new ComplianceAgentService(llm, new RAGService(llm));

const rows = [];
let planted = 0, found = 0, offTarget = 0, falseAlarms = 0, findingsTotal = 0;
for (const c of cases) {
  const result = await agent.analyzeCompliance(c.content, c.frameworks, c.target_type);
  const cited = new Set(result.findings.map((f: Finding) => f.article_id));
  const accepted = new Set(c.planted.flatMap((p) => p.accept));
  const hits = c.planted.map((p) => ({ label: p.label, found: p.accept.some((a) => cited.has(a)) }));
  const off = result.findings.filter((f: Finding) => !accepted.has(f.article_id));
  planted += c.planted.length;
  found += hits.filter((h) => h.found).length;
  findingsTotal += result.findings.length;
  if (c.planted.length === 0) falseAlarms += result.findings.length;
  else offTarget += off.length;
  rows.push({
    id: c.id,
    mode: result.mode,
    planted: hits,
    findings: result.findings.map((f: Finding) => ({ article_id: f.article_id, severity: f.severity, description: f.description })),
    off_target: off.map((f: Finding) => f.article_id),
  });
  console.log(`${c.id}: ${hits.filter((h) => h.found).length}/${c.planted.length} found, ${result.findings.length} findings (${off.length} off-target)`);
}

const summary = {
  model: llm.model,
  cases: cases.length,
  planted_violations: planted,
  found,
  recall: planted ? +(found / planted).toFixed(3) : null,
  findings_total: findingsTotal,
  off_target_findings_on_violation_cases: offTarget,
  findings_on_clean_cases: falseAlarms,
};
console.log(JSON.stringify(summary, null, 2));
const label = process.argv[2] ?? new Date().toISOString().slice(0, 10);
mkdirSync(new URL("../eval/results/", import.meta.url), { recursive: true });
writeFileSync(new URL(`../eval/results/${label}.json`, import.meta.url), JSON.stringify({ summary, rows }, null, 2));
