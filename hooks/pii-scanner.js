#!/usr/bin/env node
/**
 * PII Scanner Hook
 *
 * Claude Code PreToolUse hook for Edit and Write. Scans the text about to be
 * written for Personally Identifiable Information and blocks the tool call
 * when it finds any.
 *
 * Input (stdin): the PreToolUse JSON payload, { tool_name, tool_input, ... }.
 * Exit codes:
 *   0 - allow (no PII found, or the payload could not be parsed)
 *   2 - block; the report on stderr is shown to Claude as the reason
 */

const PII_PATTERNS = [
  {
    name: 'SSN',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    severity: 'critical',
    description: 'US Social Security Number'
  },
  {
    name: 'Credit Card',
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g,
    severity: 'critical',
    description: 'Credit Card Number'
  },
  {
    name: 'Email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    severity: 'high',
    description: 'Email Address'
  },
  {
    name: 'Phone',
    pattern: /\b(?:\+?1[-.\s]?)?(?:\(?[0-9]{3}\)?[-.\s]?)?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
    severity: 'medium',
    description: 'Phone Number'
  },
  {
    name: 'API Key',
    pattern: /\b(?:api[_-]?key|apikey|api[_-]?secret|secret[_-]?key)[\s:='"]*[A-Za-z0-9_\-]{20,}\b/gi,
    severity: 'critical',
    description: 'API Key or Secret'
  },
  {
    name: 'Password',
    pattern: /\b(?:password|passwd|pwd)[\s:='"]+\S{4,}\b/gi,
    severity: 'critical',
    description: 'Password in Plain Text'
  },
  {
    name: 'IBAN',
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/g,
    severity: 'critical',
    description: 'International Bank Account Number'
  }
];

// Allowlist patterns that should not trigger alerts
const ALLOWLIST = [
  /example\.com/gi,
  /test@test\./gi,
  /placeholder/gi,
  /xxx-xx-xxxx/gi,
  /000-00-0000/gi,
  /sample/gi,
  /dummy/gi,
  /fake/gi
];

function isAllowlisted(content, match) {
  // Check if match is in an allowlisted context
  const context = content.substring(
    Math.max(0, content.indexOf(match) - 20),
    Math.min(content.length, content.indexOf(match) + match.length + 20)
  ).toLowerCase();

  return ALLOWLIST.some(pattern => pattern.test(context));
}

function scanForPII(content) {
  const findings = [];

  for (const piiType of PII_PATTERNS) {
    // Reset regex state
    piiType.pattern.lastIndex = 0;

    let match;
    while ((match = piiType.pattern.exec(content)) !== null) {
      const value = match[0];

      // Skip if allowlisted
      if (isAllowlisted(content, value)) {
        continue;
      }

      findings.push({
        type: piiType.name,
        description: piiType.description,
        severity: piiType.severity,
        value: value,
        position: match.index,
        redacted: redactValue(value)
      });
    }
  }

  return findings;
}

function redactValue(value) {
  if (value.length <= 4) {
    return '*'.repeat(value.length);
  }
  const keep = Math.min(2, Math.floor(value.length / 4));
  return value.substring(0, keep) + '*'.repeat(value.length - keep * 2) + value.substring(value.length - keep);
}

function main() {
  // Read tool input from stdin
  let input = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    input += chunk;
  });

  process.stdin.on('end', () => {
    try {
      const toolCall = JSON.parse(input);

      // Extract content to scan based on tool type
      let contentToScan = '';

      if (toolCall.tool_name === 'Edit') {
        contentToScan = toolCall.tool_input?.new_string || '';
      } else if (toolCall.tool_name === 'Write') {
        contentToScan = toolCall.tool_input?.content || '';
      }

      if (!contentToScan) {
        // No content to scan, allow operation
        process.exit(0);
      }

      const findings = scanForPII(contentToScan);

      if (findings.length === 0) {
        // No PII found, allow operation
        process.exit(0);
      }

      // PII detected, report and block
      console.error('\n⚠️  PII SCANNER: Content blocked');
      console.error('━'.repeat(40));
      console.error(`Found ${findings.length} PII item(s):\n`);

      for (const finding of findings) {
        const icon = finding.severity === 'critical' ? '🔴' :
                     finding.severity === 'high' ? '🟠' : '🟡';
        console.error(`${icon} [${finding.severity.toUpperCase()}] ${finding.type}`);
        console.error(`   Detected: ${finding.redacted}`);
        console.error(`   ${finding.description}\n`);
      }

      console.error('━'.repeat(40));
      console.error('Recommendation: Remove or redact PII before writing to files.');
      console.error('Use environment variables or secret managers for sensitive data.\n');

      // Exit code 2 is what makes Claude Code block the tool call.
      process.exit(2);

    } catch (error) {
      console.error('PII Scanner Error:', error.message);
      // On error, allow operation but log warning
      process.exit(0);
    }
  });
}

if (require.main === module) {
  main();
}

module.exports = { scanForPII, redactValue };
