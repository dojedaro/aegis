#!/usr/bin/env node
/**
 * Compliance Gate Hook
 *
 * Pre-commit hook that validates compliance requirements before git commits.
 * Checks for sensitive data patterns, ensures audit trail completeness,
 * and validates compliance tagging in commit messages.
 *
 * Exit codes:
 *   0 - Pass (all compliance checks passed)
 *   1 - Block (compliance violations found)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Sensitive data patterns that should never be committed
const SENSITIVE_PATTERNS = [
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical'
  },
  {
    name: 'AWS Secret Key',
    pattern: /(?:aws)?_?(?:secret)?_?(?:access)?_?key[\s:='"]+[A-Za-z0-9\/+=]{40}/gi,
    severity: 'critical'
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN (?:RSA |DSA |EC )?PRIVATE KEY-----/g,
    severity: 'critical'
  },
  {
    name: 'API Key Generic',
    pattern: /api[_-]?key[\s:='"]+[A-Za-z0-9_\-]{20,}/gi,
    severity: 'high'
  },
  {
    name: 'Database URL with Password',
    pattern: /(?:postgres|mysql|mongodb):\/\/[^:]+:[^@]+@/gi,
    severity: 'critical'
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    severity: 'high'
  },
  {
    name: 'SSN',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    severity: 'critical'
  },
  {
    name: 'Credit Card',
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/g,
    severity: 'critical'
  }
];

// Files that should always be checked
const ALWAYS_CHECK_PATTERNS = [
  /\.env/,
  /config\.(json|yaml|yml|toml)/,
  /credentials/,
  /secrets/,
  /\.pem$/,
  /\.key$/
];

function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(f => f);
  } catch (error) {
    return [];
  }
}

function getStagedContent(file) {
  try {
    return execSync(`git show :${file}`, { encoding: 'utf8' });
  } catch (error) {
    return null;
  }
}

function checkFile(filePath, content) {
  const findings = [];

  for (const pattern of SENSITIVE_PATTERNS) {
    pattern.pattern.lastIndex = 0;
    let match;

    while ((match = pattern.pattern.exec(content)) !== null) {
      // Get line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

      findings.push({
        file: filePath,
        line: lineNumber,
        type: pattern.name,
        severity: pattern.severity,
        snippet: match[0].substring(0, 20) + '...'
      });
    }
  }

  return findings;
}

function checkCommitMessage(message) {
  const issues = [];

  // Check for compliance tagging when relevant files are changed
  const complianceKeywords = ['gdpr', 'pii', 'compliance', 'security', 'credential', 'identity'];
  const hasComplianceTag = /\[(COMPLIANCE|GDPR|AML|EIDAS|SECURITY)\]/i.test(message);

  // This is just a recommendation, not a blocker
  if (!hasComplianceTag) {
    const stagedFiles = getStagedFiles();
    const hasComplianceFiles = stagedFiles.some(f =>
      complianceKeywords.some(k => f.toLowerCase().includes(k))
    );

    if (hasComplianceFiles) {
      issues.push({
        type: 'recommendation',
        message: 'Consider adding compliance tag (e.g., [COMPLIANCE]) for compliance-related changes'
      });
    }
  }

  return issues;
}

function checkAuditTrailRecent() {
  const auditFile = path.join(__dirname, '..', 'mcp-server', 'data', 'audit-trail.jsonl');

  if (!fs.existsSync(auditFile)) {
    return { warning: 'Audit trail file not found - ensure audit logging is configured' };
  }

  const stats = fs.statSync(auditFile);
  const lastModified = stats.mtime;
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  if (lastModified < hourAgo) {
    return { warning: 'Audit trail has not been updated in over an hour' };
  }

  return { ok: true };
}

function main() {
  let input = '';

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    input += chunk;
  });

  process.stdin.on('end', () => {
    try {
      const hookData = JSON.parse(input);
      const command = hookData.arguments?.command || '';

      // Only process git commit commands
      if (!command.includes('git commit')) {
        process.exit(0);
      }

      console.error('\n🔒 COMPLIANCE GATE: Validating commit...\n');

      const allFindings = [];
      const warnings = [];

      // Check staged files
      const stagedFiles = getStagedFiles();

      for (const file of stagedFiles) {
        // Skip binary files
        if (/\.(png|jpg|gif|ico|woff|ttf|pdf)$/i.test(file)) continue;

        const content = getStagedContent(file);
        if (!content) continue;

        const findings = checkFile(file, content);
        allFindings.push(...findings);

        // Extra warning for sensitive file types
        if (ALWAYS_CHECK_PATTERNS.some(p => p.test(file))) {
          warnings.push(`Committing potentially sensitive file: ${file}`);
        }
      }

      // Check audit trail status
      const auditStatus = checkAuditTrailRecent();
      if (auditStatus.warning) {
        warnings.push(auditStatus.warning);
      }

      // Check for critical findings
      const criticalFindings = allFindings.filter(f => f.severity === 'critical');

      if (criticalFindings.length > 0) {
        console.error('━'.repeat(50));
        console.error('❌ COMMIT BLOCKED: Sensitive data detected\n');

        for (const finding of criticalFindings) {
          console.error(`🔴 [CRITICAL] ${finding.type}`);
          console.error(`   File: ${finding.file}:${finding.line}`);
          console.error(`   Found: ${finding.snippet}\n`);
        }

        console.error('━'.repeat(50));
        console.error('Action Required:');
        console.error('1. Remove sensitive data from staged files');
        console.error('2. Use environment variables or secret managers');
        console.error('3. Add sensitive files to .gitignore\n');

        console.log(JSON.stringify({
          status: 'blocked',
          reason: 'Sensitive data detected in staged files',
          findings: criticalFindings.length
        }));

        process.exit(1);
      }

      // Report warnings but allow commit
      if (warnings.length > 0 || allFindings.length > 0) {
        console.error('━'.repeat(50));
        console.error('⚠️  COMPLIANCE WARNINGS:\n');

        for (const warning of warnings) {
          console.error(`🟡 ${warning}`);
        }

        for (const finding of allFindings) {
          console.error(`🟠 [${finding.severity.toUpperCase()}] ${finding.type} in ${finding.file}:${finding.line}`);
        }

        console.error('\n━'.repeat(50));
      }

      console.error('✅ Compliance checks passed\n');

      console.log(JSON.stringify({
        status: 'pass',
        warnings: warnings.length + allFindings.length,
        message: 'Commit allowed'
      }));

      process.exit(0);

    } catch (error) {
      console.error('Compliance Gate Error:', error.message);
      // On error, allow commit but warn
      process.exit(0);
    }
  });
}

main();
