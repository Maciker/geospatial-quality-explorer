#!/usr/bin/env node
const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const input = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
const toolInput = input.tool_input || {};
const command = String(toolInput.command || toolInput.cmd || '');
const dangerous = [
  /(^|\s)rm\s+-rf\s+(\/|\.|\*)($|\s)/,
  /git\s+reset\s+--hard/,
  /git\s+clean\s+-f/,
  /find\s+.+\s+-delete/,
  /chmod\s+-R\s+777/,
  /(curl|wget)\s+[^|]+\|\s*(sh|bash)/,
];
if (dangerous.some((pattern) => pattern.test(command))) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: 'Dangerous or destructive command blocked by agent-guardrails-ts.'
    }
  }));
  process.exit(0);
}
const generatedTargets = ['.cursor/', '.github/prompts/', '.github/instructions/', '.codex/AGENTS.md', '.codex/config.toml', '.codex/agents/'];
const touchesGenerated = generatedTargets.some((target) => command.includes(target));
const touchesBaseline = command.includes('quality/baselines/') || command.includes('.quality/baseline');
const messages = [];
if (touchesGenerated) messages.push('Vendor files are generated. Edit .ai/ first, then run pnpm ai:sync.');
if (touchesBaseline) messages.push('Quality baseline changes require explicit human approval and must never add new findings automatically.');
if (messages.length) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: messages.join(' ')
    }
  }));
}
