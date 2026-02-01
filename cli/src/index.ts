#!/usr/bin/env node
import { Command } from "commander";
import { checkCommand } from "./commands/check.js";
import { auditCommand } from "./commands/audit.js";
import { riskCommand } from "./commands/risk.js";
import { demoCommand } from "./commands/demo.js";

const program = new Command();

program
  .name("aegis")
  .description("Aegis Compliance CLI - AI-Powered Compliance Operations")
  .version("1.0.0");

program
  .command("check")
  .description("Run compliance check on a file or directory")
  .argument("[target]", "File or directory to check", ".")
  .option("-f, --frameworks <frameworks>", "Comma-separated frameworks: gdpr,eidas2,aml", "gdpr,eidas2,aml")
  .option("-o, --output <format>", "Output format: table, json, markdown", "table")
  .action(checkCommand);

program
  .command("audit")
  .description("View and query audit trail")
  .option("-p, --period <period>", "Time period: today, week, month, all", "week")
  .option("-a, --actor <actor>", "Filter by actor")
  .option("-r, --risk <level>", "Filter by risk level: low, medium, high, critical")
  .option("-l, --limit <number>", "Limit number of entries", "20")
  .action(auditCommand);

program
  .command("risk")
  .description("Run risk assessment on an entity")
  .argument("<entity>", "Entity identifier to assess")
  .option("-t, --type <type>", "Entity type: customer, transaction, process, system", "customer")
  .option("-j, --jurisdiction <jurisdiction>", "Jurisdiction context", "EU")
  .action(riskCommand);

program
  .command("demo")
  .description("Interactive demonstration of Aegis capabilities")
  .action(demoCommand);

program.parse();
