#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fsHelpers } from '../lib/fsx.mjs';

const root = process.cwd();
const { read, relativeFromRoot, listFiles } = fsHelpers(root);
let failures = 0;

const fail = (message) => {
  console.error(`Dogfood check failed: ${message}`);
  failures += 1;
};

const requireFile = (path) => {
  if (!existsSync(join(root, path))) fail(`missing ${path}`);
};

const runNode = (script) => {
  const result = spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (result.status !== 0) {
    fail(`${script} exited with ${result.status}`);
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
};

const packageJson = JSON.parse(read('package.json'));
if (!packageJson.private) fail('GIS workspace must remain a private npm package');
requireFile('docs/workflow-provenance.json');
requireFile('pnpm-workspace.yaml');

const requiredScripts = [
  'setup:hooks',
  'ai:sync',
  'vendors:check',
  'codex:check',
  'codex:skills:budget',
  'quality:vendor',
  'quality:codex',
  'quality:fast',
  'quality:full',
  'qa:prepare',
  'qa:gate',
  'dogfood:check',
  'quality:stabilization',
];
for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) fail(`missing package script ${script}`);
}

for (const path of [
  'docs/dogfooding.md',
  'docs/troubleshooting.md',
  'docs/windows-troubleshooting.md',
  'docs/codex-hardening.md',
  'docs/vendor-sync.md',
  'docs/repository-onboarding.md',
  'docs/trust-model.md',
  'docs/context-engineering.md',
  'docs/review-layers.md',
  'docs/human-in-the-loop.md',
  'docs/skill-intake-policy.md',
  'examples/tasks/01-small-refactor.md',
  'examples/tasks/02-new-usecase.md',
  'examples/tasks/03-review-only.md',
  'examples/tasks/04-qa-cross-model.md',
  'examples/tasks/05-vendor-sync.md',
  '.ai/commands/repo-discovery.md',
  '.ai/agents/repository-analyst.md',
  '.ai/policies/trust-model.md',
  '.ai/policies/context-budget.md',
  '.ai/templates/repo-analysis/repo-map.md',
  '.ai/templates/repo-analysis/validation-map.md',
  '.ai/templates/repo-analysis/architecture-map.md',
  '.ai/templates/repo-analysis/risk-map.md',
  '.ai/templates/repo-analysis/agent-onboarding.md',
  '.ai/templates/repo-analysis/suggested-agents-update.md',
  '.ai/workspace/repo-analysis/.gitkeep',
  '.ai/workspace/tasks/.gitkeep',
  'quality/profiles/trust-model.md',
  '.githooks/pre-commit',
  '.githooks/pre-push',
  '.ai/workspace/.gitignore',
  '.ai/agents/task-researcher.md',
  '.ai/agents/context-manager.md',
  '.ai/commands/task-research.md',
  '.ai/commands/compact-progress.md',
  '.ai/commands/concise.md',
  '.ai/policies/agent-behavior.md',
  '.ai/policies/concise-communication.md',
  '.ai/templates/tasks/task-index.md',
  '.ai/templates/tasks/research.md',
  '.ai/templates/tasks/progress.md',
  'docs/task-workspace.md',
  'docs/task-research.md',
  'docs/progress-compaction.md',
  'docs/agent-behavior.md',
  'docs/concise-communication.md',
  'quality/profiles/context-engineering.md',
  'quality/quality.yml',
  'docs/package-family.md',
  'docs/split-architecture.md',
  'docs/typescript-package.md',
]) requireFile(path);

const taskFiles = listFiles('examples/tasks', '.md');
if (taskFiles.length < 5) fail('expected at least five dogfood task files');
for (const taskFile of taskFiles) {
  const content = read(relativeFromRoot(taskFile));
  for (const heading of ['# ', '## Goal', '## Pass criteria']) {
    if (!content.includes(heading)) fail(`${relativeFromRoot(taskFile)} missing ${heading}`);
  }
}

const workspaceGitignore = read('.ai/workspace/.gitignore');
for (const pattern of ['qa/outputs/', 'findings/', 'summaries/', 'plans/', 'prds/']) {
  if (!workspaceGitignore.includes(pattern)) fail(`.ai/workspace/.gitignore missing ${pattern}`);
}
for (const pattern of ['repo-analysis/', 'tasks/']) {
  if (!workspaceGitignore.includes(pattern)) fail(`.ai/workspace/.gitignore missing ${pattern}`);
}


const changelog = read('CHANGELOG.md');
if (!changelog.includes('## 0.8.0')) fail('CHANGELOG.md missing 0.8.0 entry');
if (!changelog.includes('## 0.7.6')) fail('CHANGELOG.md missing 0.7.6 entry');
if (!changelog.includes('## 0.7.4')) fail('CHANGELOG.md missing 0.7.4 entry');
if (!changelog.includes('## 0.7.2')) fail('CHANGELOG.md missing 0.7.2 entry');

const readme = read('docs/upstream-workflow.md');
if (!readme.includes('v0.8.0 additions')) fail('README.md missing v0.8.0 additions section');
if (!readme.includes('pnpm dogfood:check')) fail('README.md missing dogfood command');
if (!readme.includes('/repo-discovery')) fail('README.md missing repo-discovery command');
if (!readme.includes('v0.7.6 additions')) fail('README.md missing v0.7.6 additions section');
if (!readme.includes('v0.7.4 additions')) fail('README.md missing v0.7.4 additions section');
if (!readme.includes('v0.7.2 additions')) fail('README.md missing v0.7.2 additions section');

const forbiddenManualEditNoticeTargets = [
  '.cursor/README.md',
  '.codex/README.md',
  '.github/copilot-instructions.md',
];
for (const path of forbiddenManualEditNoticeTargets) {
  const content = read(path);
  if (!content.toLowerCase().includes('generated') && !content.toLowerCase().includes('do not edit')) {
    fail(`${path} should make generated-file policy clear`);
  }
}

runNode('tools/vendors/check-vendor-adapters.mjs');
runNode('tools/vendors/check-codex-adapter.mjs');
runNode('tools/vendors/check-codex-skill-budget.mjs');

if (failures > 0) {
  console.error(`Dogfood check failed with ${failures} issue(s)`);
  process.exit(1);
}

console.log('Dogfood check passed');
