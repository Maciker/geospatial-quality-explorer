#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
let changed = '';
try {
  changed = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
} catch {
  process.exit(0);
}
const files = changed.split('\n').filter(Boolean);
const touchesSource = files.some((file) => /^(src|test|tools)\//.test(file) || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.mjs'));
const touchesVendors = files.some((file) => /^(\.cursor|\.github|\.codex|\.agents|\.hermes)\//.test(file));
const hints = [];
if (touchesSource) hints.push('Source or test files changed. Run pnpm quality:fast before finishing.');
if (touchesVendors) hints.push('Vendor adapter files changed. Prefer editing .ai/ and run pnpm ai:sync, then pnpm vendors:check.');
if (hints.length) {
  console.log(JSON.stringify({
    systemMessage: hints.join(' ')
  }));
}
