/**
 * Tests for the Claude Code hooks. Each test pipes a payload in the shape
 * Claude Code sends on stdin and checks the exit code, because the exit code
 * is the contract: 2 blocks the tool call, 0 lets it through.
 *
 * Run with: node --test hooks/hooks.test.js
 */
const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const { scanForPII } = require('./pii-scanner.js');

// Fixtures are assembled at runtime so this file holds no literal PII and
// passes the scanner it tests.
const FAKE_SSN = ['123', '45', '6789'].join('-');
const FAKE_CARD = '4' + '1'.repeat(15);

function runHook(script, payload) {
  return spawnSync(process.execPath, [path.join(__dirname, script)], {
    input: typeof payload === 'string' ? payload : JSON.stringify(payload),
    encoding: 'utf8',
  });
}

test('pii-scanner blocks a Write that contains an SSN', () => {
  const result = runHook('pii-scanner.js', {
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: 'notes.txt', content: `Customer SSN ${FAKE_SSN}` },
  });
  assert.strictEqual(result.status, 2);
  assert.match(result.stderr, /SSN/);
  assert.ok(!result.stderr.includes(FAKE_SSN), 'the report must not echo the raw value');
});

test('pii-scanner blocks an Edit whose new text contains a card number', () => {
  const result = runHook('pii-scanner.js', {
    hook_event_name: 'PreToolUse',
    tool_name: 'Edit',
    tool_input: { file_path: 'a.ts', old_string: 'x', new_string: `card ${FAKE_CARD}` },
  });
  assert.strictEqual(result.status, 2);
});

test('pii-scanner allows clean content', () => {
  const result = runHook('pii-scanner.js', {
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: { file_path: 'a.ts', content: 'export const retries = 3;' },
  });
  assert.strictEqual(result.status, 0);
});

test('pii-scanner allows documented placeholder values', () => {
  assert.deepStrictEqual(scanForPII('contact: someone@example.com'), []);
});

test('pii-scanner fails open on a payload it cannot parse', () => {
  assert.strictEqual(runHook('pii-scanner.js', 'not json').status, 0);
});

test('compliance-gate ignores Bash commands that are not commits', () => {
  const result = runHook('compliance-gate.js', {
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command: 'npm test' },
  });
  assert.strictEqual(result.status, 0);
});

test('audit-logger records the tool call and never blocks', () => {
  const auditFile = path.join(__dirname, '..', 'mcp-server', 'data', 'audit-trail.jsonl');
  const before = fs.existsSync(auditFile) ? fs.readFileSync(auditFile, 'utf8') : null;
  try {
    const result = runHook('audit-logger.js', {
      hook_event_name: 'PostToolUse',
      tool_name: 'Read',
      tool_input: { file_path: 'README.md' },
      tool_response: {},
    });
    assert.strictEqual(result.status, 0);
    const lines = fs.readFileSync(auditFile, 'utf8').trim().split('\n');
    const entry = JSON.parse(lines[lines.length - 1]);
    assert.strictEqual(entry.action, 'tool_read');
    assert.strictEqual(entry.resource, 'file:README.md');
  } finally {
    // Leave the audit trail as it was found.
    if (before === null) fs.rmSync(auditFile, { force: true });
    else fs.writeFileSync(auditFile, before);
  }
});
