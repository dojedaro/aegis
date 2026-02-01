#!/usr/bin/env node
/**
 * PII Scanner Hook
 *
 * Pre-edit/write hook that scans content for Personally Identifiable Information.
 * Blocks operations containing detected PII and suggests redaction.
 *
 * Exit codes:
 *   0 - Pass (no PII detected or user override)
 *   1 - Block (PII detected)
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

      if (toolCall.tool === 'Edit') {
        contentToScan = toolCall.arguments?.new_string || '';
      } else if (toolCall.tool === 'Write') {
        contentToScan = toolCall.arguments?.content || '';
      }

      if (!contentToScan) {
        // No content to scan, allow operation
        process.exit(0);
      }

      const findings = scanForPII(contentToScan);

      if (findings.length === 0) {
        // No PII found, allow operation
        console.log(JSON.stringify({
          status: 'pass',
          message: 'No PII detected'
        }));
        process.exit(0);
      }

      // PII detected, report and block
      const criticalCount = findings.filter(f => f.severity === 'critical').length;
      const highCount = findings.filter(f => f.severity === 'high').length;

      const report = {
        status: 'blocked',
        message: `PII detected: ${findings.length} item(s) found`,
        summary: {
          total: findings.length,
          critical: criticalCount,
          high: highCount,
          medium: findings.length - criticalCount - highCount
        },
        findings: findings.map(f => ({
          type: f.type,
          description: f.description,
          severity: f.severity,
          detected: f.redacted,
          suggestion: `Replace with: ${f.redacted}`
        })),
        recommendation: 'Remove or redact PII before proceeding. Use tokenization or environment variables for sensitive data.'
      };

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

      console.log(JSON.stringify(report));
      process.exit(1);

    } catch (error) {
      console.error('PII Scanner Error:', error.message);
      // On error, allow operation but log warning
      process.exit(0);
    }
  });
}

main();
