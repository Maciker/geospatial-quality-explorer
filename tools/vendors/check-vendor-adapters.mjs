#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  '.cursor/README.md',
  '.cursor/rules/00-agent-workflow.mdc',
  '.cursor/rules/10-architecture-hexagonal.mdc',
  '.cursor/rules/20-design-principles.mdc',
  '.cursor/rules/30-testing-standards.mdc',
  '.cursor/rules/40-xp-tdd.mdc',
  '.cursor/mcp.json',
  '.github/copilot-instructions.md',
  '.github/instructions/architecture.instructions.md',
  '.github/instructions/testing.instructions.md',
  '.github/prompts/plan.prompt.md',
  '.github/prompts/execute.prompt.md',
  '.github/prompts/review.prompt.md',
  '.codex/config.toml',
  '.codex/AGENTS.md',
  '.codex/hooks.json',
  '.codex/hooks/pre_tool_use_policy.mjs',
  '.codex/hooks/post_tool_use_quality_hint.mjs',
  '.agents/skills/architecture-hexagonal/SKILL.md',
  '.agents/skills/design-principles/SKILL.md',
  '.hermes/config.yaml',
  '.hermes/README.md',
  '.hermes/AGENTS.md',
  '.hermes/skills/architecture-hexagonal/SKILL.md',
];

const listFiles = (dir, predicate = () => true) => {
  if (!existsSync(join(root, dir))) return [];
  return readdirSync(join(root, dir))
    .map((entry) => join(root, dir, entry))
    .filter((path) => statSync(path).isFile() && predicate(path));
};

const listDirs = (dir) => {
  if (!existsSync(join(root, dir))) return [];
  return readdirSync(join(root, dir))
    .map((entry) => join(root, dir, entry))
    .filter((path) => statSync(path).isDirectory());
};

const relativeFromRoot = (file) => relative(root, file).replaceAll('\\', '/');

const fail = (message) => {
  console.error(`Vendor adapter check failed: ${message}`);
  process.exitCode = 1;
};

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) fail(`missing ${file}`);
}

const aiAgents = listFiles('.ai/agents', (path) => path.endsWith('.md')).map((path) => basename(path)).sort();
const cursorAgents = listFiles('.cursor/agents', (path) => path.endsWith('.md')).map((path) => basename(path)).sort();
if (aiAgents.join('|') !== cursorAgents.join('|')) {
  fail('Cursor agents are not synchronized with .ai/agents');
}

const codexAgents = listFiles('.codex/agents', (path) => path.endsWith('.toml')).map((path) => basename(path).replace(/\.toml$/, '.md')).sort();
if (aiAgents.join('|') !== codexAgents.join('|')) {
  fail('Codex agents are not synchronized with .ai/agents');
}

for (const agentName of aiAgents.map((name) => name.replace(/\.md$/, ''))) {
  const configPath = join(root, '.codex', 'agents', `${agentName}.toml`);
  if (!existsSync(configPath)) fail(`missing .codex/agents/${agentName}.toml`);
}

const aiSkills = listDirs('.ai/skills').map((path) => basename(path)).sort();
const cursorSkills = listDirs('.cursor/skills').map((path) => basename(path)).sort();
const portableSkills = listDirs('.agents/skills').map((path) => basename(path)).sort();
const hermesSkills = listDirs('.hermes/skills').map((path) => basename(path)).sort();
if (aiSkills.join('|') !== cursorSkills.join('|')) fail('Cursor skills are not synchronized with .ai/skills');
if (aiSkills.join('|') !== portableSkills.join('|')) fail('Portable .agents skills are not synchronized with .ai/skills');
if (aiSkills.join('|') !== hermesSkills.join('|')) fail('Hermes skills are not synchronized with .ai/skills');

for (const skill of aiSkills) {
  for (const rootDir of ['.cursor/skills', '.agents/skills', '.hermes/skills']) {
    const skillPath = join(root, rootDir, skill, 'SKILL.md');
    if (!existsSync(skillPath)) fail(`missing ${rootDir}/${skill}/SKILL.md`);
  }
}

for (const agentFile of cursorAgents) {
  const content = readFileSync(join(root, '.cursor/agents', agentFile), 'utf8');
  if (!content.startsWith('---\n')) fail(`Cursor agent ${agentFile} has no frontmatter`);
  if (!content.includes('readonly:')) fail(`Cursor agent ${agentFile} has no readonly setting`);
}

const generatedFiles = [
  ...listFiles('.cursor/rules'),
  ...listFiles('.cursor/agents'),
  ...listFiles('.github/instructions'),
  ...listFiles('.github/prompts'),
  join(root, '.github/copilot-instructions.md'),
  join(root, '.codex/config.toml'),
  join(root, '.codex/hooks.json'),
  ...listFiles('.codex/agents'),
  join(root, '.hermes/config.yaml'),
];
const forbiddenSecretPatterns = [/sk-[A-Za-z0-9]{20,}/, /ghp_[A-Za-z0-9]{20,}/, /github_pat_[A-Za-z0-9_]{20,}/];
for (const file of generatedFiles) {
  const content = readFileSync(file, 'utf8');
  for (const pattern of forbiddenSecretPatterns) {
    if (pattern.test(content)) fail(`possible literal secret in ${relativeFromRoot(file)}`);
  }
}

if (!process.exitCode) console.log('Vendor adapter check passed');
