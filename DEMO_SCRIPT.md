# Aegis Demo Recording Script

A step-by-step guide for recording a compelling demo video showcasing Aegis's AI capabilities.

**Recommended tool:** [Loom](https://www.loom.com/) (free) or OBS Studio

**Duration:** 2-3 minutes

---

## Pre-Recording Setup

1. Open Claude Code in the `aegis` directory
2. Have the web dashboard open at https://aegis-web-xi.vercel.app/
3. Have a sample file ready to analyze (use `examples/sample-kyc-flow/customer-data.json`)

---

## Recording Script

### Opening (10 seconds)

**Show:** Web dashboard overview

**Say:**
> "This is Aegis - an AI-powered compliance operations platform I built using Claude Code's extensibility features. Let me show you how AI agents can transform compliance workflows."

---

### Demo 1: Compliance Check Skill (45 seconds)

**In Claude Code, type:**
```
/compliance-check examples/sample-kyc-flow/customer-data.json
```

**Say:**
> "With a single command, I can invoke a compliance check. This skill orchestrates multiple AI components:
> - First, it scans for PII using the MCP tool
> - Then it analyzes against GDPR, eIDAS 2.0, and AML regulations
> - Finally, it spawns a specialized Regulatory Analyst agent for deep analysis"

**Show the output, then say:**
> "In seconds, we get a full compliance report with specific findings and remediation steps. This would typically take a compliance team hours to produce manually."

---

### Demo 2: Risk Assessment (30 seconds)

**In Claude Code, type:**
```
/risk-assess customer:C-12345 --type customer
```

**Say:**
> "For risk assessment, the platform uses a likelihood-times-impact matrix. The Risk Assessor agent evaluates multiple dimensions - compliance risk, operational risk, financial exposure."

**Show output:**
> "It automatically flags this as high-risk and recommends Enhanced Due Diligence - exactly what AML regulations require."

---

### Demo 3: Show the Architecture (30 seconds)

**Switch to web dashboard → "About This Demo" tab**

**Say:**
> "Under the hood, Aegis demonstrates the full Claude Code extensibility stack:
> - 5 custom skills that orchestrate workflows
> - An MCP server with 5 compliance tools
> - 3 hooks that automatically scan for PII and log everything
> - 4 specialized AI subagents for deep domain analysis"

---

### Demo 4: Hooks in Action (20 seconds)

**In Claude Code, try to write a file with fake PII:**
```
Create a file test.txt with content: "User SSN: 123-45-6789"
```

**Say:**
> "The PII scanner hook automatically blocks this - it detected a Social Security Number pattern. This is a deterministic guardrail that runs before any file write."

**Clean up:**
```
Delete test.txt
```

---

### Closing (15 seconds)

**Show:** GitHub repo or web dashboard

**Say:**
> "Aegis shows how AI agents can handle complex compliance workflows that traditionally require specialized teams. The full source code is available on my GitHub.
>
> Built by Daniel Ojeda - AI Enabler."

---

## Post-Recording

1. Upload to Loom or YouTube (unlisted)
2. Add the link to your GitHub README
3. Share on LinkedIn with hashtags: #AI #ClaudeCode #Compliance #AIEngineering

---

## Key Points to Emphasize

- **Speed:** "Seconds instead of hours"
- **Accuracy:** "Encoded real regulatory frameworks"
- **Automation:** "AI agents handle the complexity"
- **Safety:** "Deterministic hooks provide guardrails"
- **Architecture:** "Full extensibility stack working together"
