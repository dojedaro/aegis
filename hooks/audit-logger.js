#!/usr/bin/env node
/**
 * Audit Logger Hook
 *
 * Post-tool hook that logs all tool operations to the audit trail.
 * Creates an immutable record of all actions for compliance purposes.
 *
 * Exit codes:
 *   0 - Always passes (logging should not block operations)
 */

const fs = require('fs');
const path = require('path');

const AUDIT_FILE = path.join(__dirname, '..', 'mcp-server', 'data', 'audit-trail.jsonl');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(AUDIT_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Generate unique audit ID
function generateAuditId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `hook_${timestamp}_${random}`;
}

// Determine risk level based on tool and operation
function determineRiskLevel(tool, args) {
  // High risk operations
  if (tool === 'Bash') {
    const command = args?.command || '';
    if (command.includes('rm ') || command.includes('delete')) return 'high';
    if (command.includes('git push')) return 'medium';
    if (command.includes('sudo')) return 'high';
    return 'low';
  }

  if (tool === 'Write') return 'medium';
  if (tool === 'Edit') return 'medium';
  if (tool === 'Read') return 'low';

  return 'low';
}

// Determine if operation is compliance-relevant
function isComplianceRelevant(tool, args) {
  // Always relevant for write operations
  if (['Write', 'Edit'].includes(tool)) return true;

  // Check for compliance-related patterns
  const content = JSON.stringify(args).toLowerCase();
  const complianceKeywords = [
    'compliance', 'gdpr', 'pii', 'personal', 'customer',
    'credential', 'identity', 'kyc', 'aml', 'audit',
    'security', 'privacy', 'encrypt', 'secret'
  ];

  return complianceKeywords.some(keyword => content.includes(keyword));
}

// Sanitize arguments to remove sensitive data
function sanitizeArgs(args) {
  if (!args) return {};

  const sanitized = { ...args };

  // Truncate large content fields
  if (sanitized.content && sanitized.content.length > 200) {
    sanitized.content = sanitized.content.substring(0, 200) + '... [truncated]';
  }
  if (sanitized.new_string && sanitized.new_string.length > 200) {
    sanitized.new_string = sanitized.new_string.substring(0, 200) + '... [truncated]';
  }

  // Redact potential secrets
  const secretPatterns = /(?:password|secret|token|key|credential)[\s:='"]+\S+/gi;
  for (const key of Object.keys(sanitized)) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].replace(secretPatterns, '[REDACTED]');
    }
  }

  return sanitized;
}

// Get resource identifier from tool call
function getResource(tool, args) {
  if (args?.file_path) return `file:${args.file_path}`;
  if (args?.path) return `path:${args.path}`;
  if (args?.command) return `command:${args.command.substring(0, 50)}`;
  if (args?.url) return `url:${args.url}`;
  return `tool:${tool}`;
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

      const tool = hookData.tool || 'unknown';
      const args = hookData.arguments || {};
      const result = hookData.result || {};

      // Create audit entry
      const entry = {
        id: generateAuditId(),
        timestamp: new Date().toISOString(),
        action: `tool_${tool.toLowerCase()}`,
        actor: 'claude-code',
        resource: getResource(tool, args),
        details: {
          tool: tool,
          arguments: sanitizeArgs(args),
          resultSummary: result.success !== undefined
            ? (result.success ? 'success' : 'failure')
            : 'completed'
        },
        result: result.error ? 'failure' : 'success',
        riskLevel: determineRiskLevel(tool, args),
        complianceRelevant: isComplianceRelevant(tool, args)
      };

      // Ensure directory exists
      ensureDataDir();

      // Append to audit log (JSON Lines format)
      fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n');

      // Output confirmation
      console.log(JSON.stringify({
        status: 'logged',
        auditId: entry.id,
        message: `Operation logged to audit trail`
      }));

      process.exit(0);

    } catch (error) {
      // Log error but don't block
      console.error('Audit Logger Warning:', error.message);
      process.exit(0);
    }
  });
}

main();
