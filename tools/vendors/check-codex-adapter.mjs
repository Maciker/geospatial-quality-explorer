#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fsHelpers } from '../lib/fsx.mjs';

const root = process.cwd();
const { read, relativeFromRoot, listFiles } = fsHelpers(root);
const fail = (message) => {
  console.error(`Codex adapter check failed: ${message}`);
  process.exitCode = 1;
};
const requireFile = (path) => {
  if (!existsSync(join(root, path))) fail(`missing ${path}`);
};
const parseNames = (files, pattern) => files.map((file) => basename(file).replace(pattern, '')).sort();

for (const path of [
  '.codex/config.toml',
  '.codex/AGENTS.md',
  '.codex/README.md',
  '.codex/hooks.json',
  '.codex/hooks/pre_tool_use_policy.mjs',
  '.codex/hooks/post_tool_use_quality_hint.mjs',
]) requireFile(path);

const aiAgentFiles = listFiles('.ai/agents', '.md');
const codexAgentFiles = listFiles('.codex/agents', '.toml');
const aiAgents = parseNames(aiAgentFiles, '.md');
const codexAgents = parseNames(codexAgentFiles, '.toml');
if (aiAgents.join('|') !== codexAgents.join('|')) fail('Codex agents are not synchronized with .ai/agents');

const config = read('.codex/config.toml');
for (const required of ['project_doc_max_bytes = 32768', '[agents]', 'max_threads = 6', 'max_depth = 1', '[mcp_servers.context7]', '[mcp_servers.playwright]']) {
  if (!config.includes(required)) fail(`config.toml missing ${required}`);
}
for (const agentName of aiAgents) {
  if (!config.includes(`[agents."${agentName}"]`)) fail(`config.toml missing agents.${agentName}`);
  const content = read(`.codex/agents/${agentName}.toml`);
  for (const required of ['name =', 'description =', 'developer_instructions =', 'sandbox_mode =', 'model_reasoning_effort =']) {
    if (!content.includes(required)) fail(`${agentName}.toml missing ${required}`);
  }
}

const hooks = JSON.parse(read('.codex/hooks.json'));
for (const event of ['PreToolUse', 'PostToolUse']) {
  if (!hooks.hooks?.[event]?.length) fail(`hooks.json missing ${event}`);
}
for (const script of ['.codex/hooks/pre_tool_use_policy.mjs', '.codex/hooks/post_tool_use_quality_hint.mjs']) {
  const content = read(script);
  if (!content.startsWith('#!/usr/bin/env node')) fail(`${script} missing node shebang`);
}

const rootAgents = read('AGENTS.md').trim();
const codexAgentsMd = read('.codex/AGENTS.md').trim();
if (rootAgents !== codexAgentsMd) fail('.codex/AGENTS.md is not synchronized with root AGENTS.md');

const forbiddenSecretPatterns = [/sk-[A-Za-z0-9]{20,}/, /ghp_[A-Za-z0-9]{20,}/, /github_pat_[A-Za-z0-9_]{20,}/];
for (const path of ['.codex/config.toml', '.codex/hooks.json', ...codexAgentFiles.map(relativeFromRoot)]) {
  const content = read(path);
  for (const pattern of forbiddenSecretPatterns) {
    if (pattern.test(content)) fail(`possible literal secret in ${path}`);
  }
}

if (!process.exitCode) console.log('Codex adapter check passed');
