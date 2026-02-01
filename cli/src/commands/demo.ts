import inquirer from "inquirer";
import ora from "ora";
import * as display from "../utils/display.js";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function demonstrateCompliance(): Promise<void> {
  display.subheader("Compliance Check Demo");

  console.log("  Simulating a compliance check on sample code...\n");

  const spinner = ora("Scanning for PII patterns...").start();
  await sleep(800);
  spinner.succeed("PII scan complete");

  spinner.start("Checking GDPR requirements...");
  await sleep(600);
  spinner.succeed("GDPR check complete");

  spinner.start("Checking eIDAS 2.0 requirements...");
  await sleep(600);
  spinner.succeed("eIDAS check complete");

  spinner.start("Checking AML/KYC requirements...");
  await sleep(600);
  spinner.succeed("AML/KYC check complete");

  console.log();

  const table = display.createTable(["Finding", "Framework", "Severity", "Status"]);
  table.push(
    ["Consent mechanism needed", "GDPR", display.severity("high"), display.complianceStatus("needs_review")],
    ["Identity verification gap", "eIDAS 2.0", display.severity("medium"), display.complianceStatus("needs_review")],
    ["CDD process documented", "AML/KYC", display.severity("low"), display.complianceStatus("compliant")]
  );
  console.log(table.toString());

  display.box(
    ["Status: NEEDS REVIEW", "3 findings identified", "1 compliant, 2 require attention"],
    "Compliance Summary"
  );
}

async function demonstrateRisk(): Promise<void> {
  display.subheader("Risk Assessment Demo");

  console.log("  Simulating risk assessment for a sample customer...\n");

  const spinner = ora("Identifying risk factors...").start();
  await sleep(700);
  spinner.succeed("Risk factors identified");

  spinner.start("Calculating risk scores...");
  await sleep(500);
  spinner.succeed("Risk scores calculated");

  spinner.start("Generating recommendations...");
  await sleep(500);
  spinner.succeed("Recommendations ready");

  console.log();

  display.riskMatrix();

  const table = display.createTable(["Risk Factor", "Category", "Score", "Level"]);
  table.push(
    ["Cross-border transfers", "Compliance", "16", display.riskLevel("high")],
    ["Transaction volume", "Financial", "9", display.riskLevel("medium")],
    ["Identity completeness", "Compliance", "6", display.riskLevel("medium")],
    ["PEP exposure", "Compliance", "4", display.riskLevel("low")]
  );
  console.log(table.toString());

  display.box(["Overall Score: 12/25", "Risk Level: HIGH", "Recommended: Enhanced Due Diligence"], "Risk Summary");
}

async function demonstrateAudit(): Promise<void> {
  display.subheader("Audit Trail Demo");

  console.log("  Simulating audit trail query...\n");

  const spinner = ora("Querying audit entries...").start();
  await sleep(600);
  spinner.succeed("Audit entries retrieved");

  console.log();

  const table = display.createTable(["Time", "Action", "Actor", "Result"]);
  table.push(
    ["2024-01-15 10:30", "compliance_check", "analyst-1", display.colors.success("success")],
    ["2024-01-15 10:25", "risk_assessment", "system", display.colors.success("success")],
    ["2024-01-15 10:20", "credential_verify", "analyst-1", display.colors.success("success")],
    ["2024-01-15 10:15", "pii_scan", "hook", display.colors.warning("blocked")],
    ["2024-01-15 10:10", "data_access", "analyst-2", display.colors.success("success")]
  );
  console.log(table.toString());

  display.keyValue("Total Entries:", "127");
  display.keyValue("Compliance Relevant:", "89");
  display.keyValue("High-Risk Events:", "3");
}

async function demonstrateCredential(): Promise<void> {
  display.subheader("Credential Verification Demo");

  console.log("  Simulating W3C Verifiable Credential verification...\n");

  const spinner = ora("Parsing credential...").start();
  await sleep(400);
  spinner.succeed("Credential parsed");

  spinner.start("Verifying issuer trust...");
  await sleep(500);
  spinner.succeed("Issuer verified");

  spinner.start("Checking signature...");
  await sleep(600);
  spinner.succeed("Signature valid");

  spinner.start("Validating expiry...");
  await sleep(300);
  spinner.succeed("Credential not expired");

  console.log();

  console.log(`  ${display.icons.check} Context: Valid W3C VC context`);
  console.log(`  ${display.icons.check} Type: VerifiableCredential, IdentityCredential`);
  console.log(`  ${display.icons.check} Issuer: did:web:government.eu (TRUSTED)`);
  console.log(`  ${display.icons.check} Signature: Ed25519Signature2020`);
  console.log(`  ${display.icons.check} Expiry: Valid until 2025-06-15`);

  console.log();

  display.box(
    [
      "Verification: PASSED",
      "Credential Type: Identity",
      "Trust Level: High Assurance",
      "eIDAS Compliant: Yes",
    ],
    "Credential Status"
  );
}

async function demonstrateHooks(): Promise<void> {
  display.subheader("Hooks Demo");

  console.log("  Demonstrating Aegis hooks in action...\n");

  // PII Scanner demo
  console.log(display.colors.primary("  1. PII Scanner (Pre-Edit Hook)"));
  console.log("     Detects PII before writing to files\n");

  const spinner1 = ora("Scanning content for PII...").start();
  await sleep(800);
  spinner1.fail("PII detected - operation blocked");

  console.log();
  console.log(`     ${display.icons.critical} Found: SSN (123-**-**89)`);
  console.log(`     ${display.icons.high} Found: Email (jo***@example.com)`);
  console.log(`     ${display.colors.muted("     Recommendation: Remove PII before saving")}`);
  console.log();

  // Audit Logger demo
  console.log(display.colors.primary("  2. Audit Logger (Post-Tool Hook)"));
  console.log("     Logs all operations to audit trail\n");

  const spinner2 = ora("Logging operation...").start();
  await sleep(400);
  spinner2.succeed("Operation logged: audit_20240115_abc123");
  console.log();

  // Compliance Gate demo
  console.log(display.colors.primary("  3. Compliance Gate (Pre-Commit Hook)"));
  console.log("     Validates compliance before git commits\n");

  const spinner3 = ora("Checking staged files...").start();
  await sleep(600);
  spinner3.succeed("No sensitive data in staged files");

  const spinner4 = ora("Verifying audit trail...").start();
  await sleep(400);
  spinner4.succeed("Audit trail up to date");

  console.log();
  console.log(`     ${display.icons.check} Commit allowed`);
}

export async function demoCommand(): Promise<void> {
  display.banner();

  console.log(display.colors.muted("  Welcome to the Aegis Compliance Platform interactive demo."));
  console.log(display.colors.muted("  This walkthrough showcases the key features of Aegis.\n"));

  const { selectedDemo } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedDemo",
      message: "What would you like to explore?",
      choices: [
        { name: "🔍 Compliance Check - Analyze code for regulatory compliance", value: "compliance" },
        { name: "📊 Risk Assessment - Evaluate entity risk scores", value: "risk" },
        { name: "📋 Audit Trail - View compliance audit logs", value: "audit" },
        { name: "🎫 Credential Verification - Validate W3C VCs", value: "credential" },
        { name: "🪝 Hooks - See PII scanner & compliance gate in action", value: "hooks" },
        { name: "🎬 Full Demo - Run all demonstrations", value: "all" },
        { name: "❌ Exit", value: "exit" },
      ],
    },
  ]);

  if (selectedDemo === "exit") {
    console.log();
    display.info("Thank you for exploring Aegis!");
    return;
  }

  display.header("Aegis Demo");

  if (selectedDemo === "all" || selectedDemo === "compliance") {
    await demonstrateCompliance();
    await sleep(500);
  }

  if (selectedDemo === "all" || selectedDemo === "risk") {
    await demonstrateRisk();
    await sleep(500);
  }

  if (selectedDemo === "all" || selectedDemo === "audit") {
    await demonstrateAudit();
    await sleep(500);
  }

  if (selectedDemo === "all" || selectedDemo === "credential") {
    await demonstrateCredential();
    await sleep(500);
  }

  if (selectedDemo === "all" || selectedDemo === "hooks") {
    await demonstrateHooks();
    await sleep(500);
  }

  console.log();
  display.divider();
  console.log();

  display.success("Demo complete!");
  console.log();
  display.info("To use Aegis in your project:");
  display.bullet("Run 'aegis check <file>' for compliance checking");
  display.bullet("Run 'aegis risk <entity>' for risk assessment");
  display.bullet("Run 'aegis audit' to view the audit trail");
  console.log();
  display.info("In Claude Code, use these skills:");
  display.bullet("/compliance-check - Full regulatory analysis");
  display.bullet("/audit-report - Generate audit documentation");
  display.bullet("/risk-assess - Comprehensive risk evaluation");
  display.bullet("/credential-verify - W3C VC validation");
  display.bullet("/incident-respond - Incident response workflow");

  console.log();

  const { runAgain } = await inquirer.prompt([
    {
      type: "confirm",
      name: "runAgain",
      message: "Would you like to run another demo?",
      default: false,
    },
  ]);

  if (runAgain) {
    await demoCommand();
  }
}
