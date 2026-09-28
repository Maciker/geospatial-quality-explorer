#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, cpSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

const root = process.cwd();

const paths = {
  ai: join(root, '.ai'),
  cursor: join(root, '.cursor'),
  github: join(root, '.github'),
  codex: join(root, '.codex'),
  portableAgents: join(root, '.agents'),
  hermes: join(root, '.hermes'),
};

const read = (path) => readFileSync(path, 'utf8');
const write = (path, content) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
};

const cleanDir = (path) => {
  rmSync(path, { recursive: true, force: true });
  mkdirSync(path, { recursive: true });
};

const copyDir = (source, target) => {
  if (!existsSync(source)) return;
  rmSync(target, { recursive: true, force: true });
  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true, dereference: true });
};

const listFiles = (dir, predicate = () => true) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((entry) => join(dir, entry))
    .filter((path) => statSync(path).isFile() && predicate(path))
    .sort();
};

const listDirs = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((entry) => join(dir, entry))
    .filter((path) => statSync(path).isDirectory())
    .sort();
};

const parseFrontmatter = (content) => {
  if (!content.startsWith('---\n')) return { data: {}, body: content };
  const end = content.indexOf('\n---', 4);
  if (end === -1) return { data: {}, body: content };
  const raw = content.slice(4, end).trim();
  const body = content.slice(end + '\n---'.length).replace(/^\n/, '');
  const data = {};
  let currentListKey = null;
  for (const line of raw.split('\n')) {
    const trimmed = line.trimEnd();
    const listMatch = trimmed.match(/^\s*-\s*(.+)$/);
    if (listMatch && currentListKey) {
      data[currentListKey].push(listMatch[1].trim());
      continue;
    }
    const keyValue = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyValue) continue;
    const [, key, value] = keyValue;
    if (value === '') {
      data[key] = [];
      currentListKey = key;
    } else {
      data[key] = value.replace(/^["']|["']$/g, '');
      currentListKey = null;
    }
  }
  return { data, body };
};

const asDescription = (value, fallback) => String(value || fallback).replace(/\n/g, ' ').trim();
const readAgentDefinition = (agentFile) => {
  const { data, body } = parseFrontmatter(read(agentFile));
  const name = asDescription(data.name, basename(agentFile, '.md'));
  const description = asDescription(data.description, `${name} agent`);
  return { data, body, name, description };
};
const tomlString = (value) => JSON.stringify(String(value));
const tomlArray = (values) => `[${values.map(tomlString).join(', ')}]`;
const cursorReadonlyByAgent = (agentName) => !['debater', 'planner', 'executor'].includes(agentName);
const codexWritableByAgent = (agentName, permissionProfile) => {
  if (['debater', 'planner', 'executor', 'validator', 'maintainer-filter'].includes(agentName)) return true;
  return ['discovery-writer', 'planner', 'implementer', 'validation-runner'].includes(permissionProfile || '');
};

const syncSkills = () => {
  const source = join(paths.ai, 'skills');
  const targets = [join(paths.cursor, 'skills'), join(paths.portableAgents, 'skills')];
  for (const target of targets) {
    cleanDir(target);
    for (const skillDir of listDirs(source)) {
      copyDir(skillDir, join(target, basename(skillDir)));
    }
  }
};

const cursorRules = [
  {
    file: '00-agent-workflow.mdc',
    frontmatter: {
      description: 'Repository-wide agent workflow: discovery, plan, approval, TDD execution, review, and quality gates.',
      alwaysApply: true,
    },
    body: `# Agent workflow\n\nFollow the repository contract in AGENTS.md. The canonical source is .ai/.\n\n## Required flow\n\n1. Discovery before solution design when the request is ambiguous.\n2. Plan before implementation.\n3. Human approval before executor changes production code.\n4. TDD for behavior changes.\n5. Review after implementation.\n6. Run quality gates before finishing.\n7. Before opening a PR for agent-generated changes, invoke qa-cross-model with a clean context and run the pre-PR gate (pnpm prepr:gate).\n8. Do not open a PR if exact-SHA QA or distinct-model evidence is missing.\n\n## Guardrails\n\n- Do not implement ambiguous work. Ask one material question or create a discovery artifact.\n- Review agents are read-only. They produce findings, not fixes.\n- qa-cross-model is read-only and must not edit files.\n- Executor is the only agent allowed to apply implementation changes.\n- Do not open a PR until pnpm prepr:gate passes.\n- Never grow quality baselines automatically.\n- Prefer small vertical slices over broad edits.\n`,
  },
  {
    file: '10-architecture-hexagonal.mdc',
    frontmatter: {
      description: 'Hexagonal architecture rules for TypeScript modules, layers, ports, adapters, use cases and factories.',
      globs: 'apps/**/*.ts,apps/**/*.tsx,packages/**/*.ts,packages/**/*.tsx',
      alwaysApply: false,
    },
    body: `# Hexagonal architecture\n\nUse .ai/skills/architecture-hexagonal as the complete reference.\n\n## Dependency rule\n\nInfrastructure -> Application -> Domain\n\n- Domain never imports Application or Infrastructure.\n- Application never imports Infrastructure.\n- Infrastructure may import Application and Domain.\n- A UseCase must not import another UseCase from another module.\n- Business logic belongs in Domain or Application, never Infrastructure.\n\n## Module shape\n\nUse vertical business modules:\n\n\`\`\`text\nsrc/[module]/domain\nsrc/[module]/application\nsrc/[module]/infrastructure\nsrc/[module]/tests\n\`\`\`\n\nUse ports before adapters. Use Factory for explicit wiring.\n`,
  },
  {
    file: '20-design-principles.mdc',
    frontmatter: {
      description: 'Code design rules for naming, functions, classes, modules, error handling, CQS and Maybe usage.',
      globs: 'apps/**/*.ts,apps/**/*.tsx,packages/**/*.ts,packages/**/*.tsx,tools/**/*.mjs,test/**/*.ts',
      alwaysApply: false,
    },
    body: `# Design principles\n\nUse .ai/skills/design-principles as the complete reference.\n\n- Use concrete, pronounceable English names.\n- Avoid helper, util, manager, data, info, temp and x names.\n- Functions have one responsibility and verb names.\n- Avoid boolean flags that switch behavior.\n- Use guard clauses and low indentation.\n- Follow CQS: commands mutate and return void; queries return values and do not mutate.\n- Use DomainError factory methods for domain failures.\n- Return Maybe for optional domain values.\n- Prefer composition over inheritance.\n- No JS getters/setters or underscore private prefixes.\n`,
  },
  {
    file: '30-testing-standards.mdc',
    frontmatter: {
      description: 'Testing rules for unit, integration and E2E tests, AAA, FIRST, naming and mock policy.',
      globs: '**/*.test.ts,**/*.integration.test.ts,**/*.e2e.test.ts,test/**/*.ts',
      alwaysApply: false,
    },
    body: `# Testing standards\n\nUse .ai/skills/testing-standards as the complete reference.\n\n- Test names describe business rules, not implementation mechanics.\n- Use AAA with blank lines between Arrange, Act and Assert.\n- Tests must be fast, isolated, repeatable, self-validating and timely.\n- Use InMemory repositories for UseCase unit tests.\n- Do not mock repositories.\n- Never weaken a test to make implementation pass.\n- Use fake non-production secrets only.\n- Run pnpm test or the smallest focused script available.\n`,
  },
  {
    file: '40-xp-tdd.mdc',
    frontmatter: {
      description: 'XP and TDD workflow: REASON, RED, GREEN, REFACTOR, RE-EVALUATE, TPP and inside-out development.',
      alwaysApply: false,
    },
    body: `# XP and TDD\n\nUse .ai/skills/xp-tdd-practices as the complete reference.\n\nCycle:\n\n1. REASON: list examples from simplest to complex.\n2. RED: write one failing test.\n3. GREEN: implement the smallest code that passes.\n4. REFACTOR: improve without behavior changes.\n5. RE-EVALUATE: mark the case and choose the next one.\n\nApply TPP in GREEN. Commit only after green and refactor.\n`,
  },
  {
    file: '50-frontend-patterns.mdc',
    frontmatter: {
      description: 'Optional React profile rules for components, hooks, React Query store hooks and CSS Modules.',
      globs: '**/*.tsx,**/*.hook.ts,**/*.module.css,**/store/*.ts,**/context/*.ts',
      alwaysApply: false,
    },
    body: `# Frontend patterns\n\nUse this only when the React profile is active. Full reference: .ai/skills/frontend-patterns.\n\n- Components use props.x, not destructuring.\n- useEffect belongs in components, not custom hooks.\n- Custom hooks use one grouped useState and expose domain operations.\n- Context is dependency injection only, not shared state.\n- Store hooks hide React Query internals behind domain helpers.\n- CSS Modules only; no utility CSS frameworks.\n`,
  },
  {
    file: '60-openspec.mdc',
    frontmatter: {
      description: 'Optional OpenSpec workflow rules for proposal, design, specs, tasks, apply and archive flows.',
      globs: 'openspec/**',
      alwaysApply: false,
    },
    body: `# OpenSpec profile\n\nUse only when the OpenSpec profile is active.\n\n- Explore before implementation.\n- Propose changes through proposal, design, specs and tasks.\n- Apply tasks in order with TDD and focused validation.\n- Archive only after tasks and artifacts are complete.\n`,
  },
];

const yamlValue = (value) => {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return JSON.stringify(String(value));
};

const syncCursorRules = () => {
  const rulesDir = join(paths.cursor, 'rules');
  cleanDir(rulesDir);
  for (const rule of cursorRules) {
    const frontmatter = Object.entries(rule.frontmatter)
      .map(([key, value]) => `${key}: ${yamlValue(value)}`)
      .join('\n');
    write(join(rulesDir, rule.file), `---\n${frontmatter}\n---\n\n${rule.body}`);
  }
};

const syncCursorAgents = () => {
  const sourceDir = join(paths.ai, 'agents');
  const targetDir = join(paths.cursor, 'agents');
  cleanDir(targetDir);
  for (const agentFile of listFiles(sourceDir, (path) => path.endsWith('.md'))) {
    const { body, name, description } = readAgentDefinition(agentFile);
    const readonly = cursorReadonlyByAgent(name);
    const content = `---\nname: ${JSON.stringify(name)}\ndescription: ${JSON.stringify(description)}\nmodel: inherit\nreadonly: ${readonly ? 'true' : 'false'}\n---\n\n${body.trim()}\n\n## Cursor adapter notes\n\n- Canonical source: .ai/agents/${basename(agentFile)}.\n- Generated by pnpm sync:ai. Do not edit this file by hand.\n- Reviewers must report findings only. Debater and planner may write workspace artifacts. Executor is the only production write-capable agent.\n`;
    write(join(targetDir, basename(agentFile)), content);
  }
};

const syncCursor = () => {
  syncCursorRules();
  syncCursorAgents();
  copyDir(join(paths.ai, 'skills'), join(paths.cursor, 'skills'));
  copyDir(join(paths.ai, 'mcp.json'), join(paths.cursor, 'mcp.json'));
  write(join(paths.cursor, 'README.md'), `# Cursor adapter\n\nThis directory is generated from .ai/ by \`pnpm sync:ai\`.\n\n- \`rules/\`: focused .mdc rules for Cursor.\n- \`agents/\`: Cursor subagents generated from .ai/agents.\n- \`skills/\`: agent skills copied from .ai/skills.\n- \`mcp.json\`: project MCP config copied from .ai/mcp.json.\n\nDo not edit generated files here. Edit .ai/ and run \`pnpm sync:ai\`.\n`);
};

const githubInstructionFiles = [
  {
    file: 'architecture.instructions.md',
    applyTo: 'apps/**/*.ts,apps/**/*.tsx,packages/**/*.ts,packages/**/*.tsx',
    title: 'Architecture instructions',
    body: `Follow hexagonal architecture from .ai/skills/architecture-hexagonal. Use vertical business modules, enforce Infrastructure -> Application -> Domain, and never put business logic in Infrastructure.`,
  },
  {
    file: 'testing.instructions.md',
    applyTo: '**/*.test.ts,**/*.integration.test.ts,**/*.e2e.test.ts',
    title: 'Testing instructions',
    body: `Follow .ai/skills/testing-standards. Tests use business-rule names, AAA with blank lines, FIRST properties, and InMemory repositories for UseCase unit tests.`,
  },
  {
    file: 'frontend.instructions.md',
    applyTo: '**/*.tsx,**/*.hook.ts,**/*.module.css,**/store/*.ts,**/context/*.ts',
    title: 'Frontend profile instructions',
    body: `When the React profile is active, follow .ai/skills/frontend-patterns: props.x access, CSS Modules, useEffect in components, Context for dependency injection only, and store hooks hiding React Query internals.`,
  },
  {
    file: 'quality.instructions.md',
    applyTo: 'quality/**,tools/**,.githooks/**,.azure/**,azure-pipelines.yml',
    title: 'Quality system instructions',
    body: `Quality gates are part of the product. Do not weaken ratchet baselines, hooks, CI, or QA gates without an explicit approved plan.`,
  },
];

const promptMappings = [
  'discovery',
  'plan',
  'execute',
  'review',
  'qa',
  'pre-pr',
  'quality',
  'validate',
  'refactor',
  'enforce-tdd',
  'architecture-review',
  'code-review',
  'test-review',
  'frontend-review',
  'functional-qa',
  'ux-review',
  'openspec-explore',
  'openspec-propose',
  'openspec-apply-change',
  'openspec-archive-change',
];

const syncGithub = () => {
  mkdirSync(paths.github, { recursive: true });
  write(join(paths.github, 'copilot-instructions.md'), `# Copilot instructions\n\nRead and follow the nearest AGENTS.md file first. The canonical source for workflow, agents, commands and skills is .ai/.\n\n## Repository workflow\n\n1. Discovery before solution design when the request is ambiguous.\n2. Plan before implementation.\n3. Human approval before executor changes production code.\n4. TDD for behavior changes.\n5. Review after implementation.\n6. Run quality gates before finishing.\n\n## Build and validation\n\n- Install with pnpm install.\n- Fast local validation: pnpm quality:fast.\n- Full validation: pnpm quality:full.\n- Pre-PR gate: pnpm prepr:gate after a verified exact-SHA cross-model QA run.\n- Do not grow quality baselines automatically.\n\n## Architecture and code rules\n\n- Use hexagonal architecture for production TypeScript.\n- Follow .ai/skills/design-principles for naming, functions, classes and errors.\n- Follow .ai/skills/testing-standards for tests.\n- Follow .ai/skills/xp-tdd-practices for implementation.\n\n## Vendor adapter policy\n\nFiles under .github/instructions and .github/prompts are generated from .ai/ by pnpm sync:ai. Edit .ai/ first.\n`);

  const instructionsDir = join(paths.github, 'instructions');
  cleanDir(instructionsDir);
  for (const instruction of githubInstructionFiles) {
    write(join(instructionsDir, instruction.file), `---\napplyTo: ${JSON.stringify(instruction.applyTo)}\n---\n\n# ${instruction.title}\n\n${instruction.body}\n`);
  }
  write(join(instructionsDir, 'agent-guardrails.instructions.md'), read(join(root, 'AGENTS.md')));

  const promptsDir = join(paths.github, 'prompts');
  cleanDir(promptsDir);
  for (const name of promptMappings) {
    const source = join(paths.ai, 'commands', `${name}.md`);
    if (!existsSync(source)) continue;
    const title = name.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ');
    write(join(promptsDir, `${name}.prompt.md`), `---\ndescription: ${JSON.stringify(`${title} workflow from agent-guardrails-ts`)}\n---\n\n# ${title}\n\nRead AGENTS.md first. Then follow this workflow.\n\n${read(source).trim()}\n`);
  }
};

const codexAgentInstructions = (name, description, permissionProfile, skills, body) => {
  const writable = codexWritableByAgent(name, permissionProfile);
  const skillLine = skills.length ? `\nRelevant skills: ${skills.join(', ')}.` : '';
  const writePolicy = writable
    ? 'You may write only the artifacts your role owns. Executor may edit production code only from an approved plan.'
    : 'Read-only. Do not edit files. Produce findings, reports, or recommendations in the response.';
  return `${description}\n\n${writePolicy}${skillLine}\n\nFollow AGENTS.md and the canonical role definition below.\n\n${body.trim()}`;
};

const syncCodexAgents = () => {
  const agentsDir = join(paths.codex, 'agents');
  cleanDir(agentsDir);
  const sourceDir = join(paths.ai, 'agents');
  const configEntries = [];
  for (const agentFile of listFiles(sourceDir, (path) => path.endsWith('.md'))) {
    const { data, body, name, description } = readAgentDefinition(agentFile);
    const permissionProfile = asDescription(data.permission_profile, 'readonly-reviewer');
    const skills = Array.isArray(data.skills) ? data.skills : [];
    const writable = codexWritableByAgent(name, permissionProfile);
    const effort = ['executor', 'planner', 'architecture-reviewer', 'code-reviewer', 'qa-cross-model', 'security-reviewer'].includes(name) ? 'high' : 'medium';
    const nicknames = [`${name.replace(/-/g, ' ')} 1`, `${name.replace(/-/g, ' ')} 2`];
    const toml = [
      '# Generated from .ai/agents. Do not edit by hand; run pnpm ai:sync.',
      `name = ${tomlString(name)}`,
      `description = ${tomlString(description)}`,
      `sandbox_mode = ${tomlString(writable ? 'workspace-write' : 'read-only')}`,
      `model_reasoning_effort = ${tomlString(effort)}`,
      `nickname_candidates = ${tomlArray(nicknames)}`,
      `developer_instructions = ${tomlString(codexAgentInstructions(name, description, permissionProfile, skills, body))}`,
      '',
    ].join('\n');
    write(join(agentsDir, `${name}.toml`), toml);
    configEntries.push({ name, description });
  }
  return configEntries.sort((a, b) => a.name.localeCompare(b.name));
};

const writeCodexHooks = () => {
  const hooksDir = join(paths.codex, 'hooks');
  cleanDir(hooksDir);
  write(join(hooksDir, 'pre_tool_use_policy.mjs'), `#!/usr/bin/env node\nconst chunks = [];\nfor await (const chunk of process.stdin) chunks.push(chunk);\nconst input = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');\nconst toolInput = input.tool_input || {};\nconst command = String(toolInput.command || toolInput.cmd || '');\nconst dangerous = [\n  /(^|\\s)rm\\s+-rf\\s+(\\/|\\.|\\*)($|\\s)/,\n  /git\\s+reset\\s+--hard/,\n  /git\\s+clean\\s+-f/,\n  /find\\s+.+\\s+-delete/,\n  /chmod\\s+-R\\s+777/,\n  /(curl|wget)\\s+[^|]+\\|\\s*(sh|bash)/,\n];\nif (dangerous.some((pattern) => pattern.test(command))) {\n  console.log(JSON.stringify({\n    hookSpecificOutput: {\n      hookEventName: 'PreToolUse',\n      permissionDecision: 'deny',\n      permissionDecisionReason: 'Dangerous or destructive command blocked by agent-guardrails-ts.'\n    }\n  }));\n  process.exit(0);\n}\nconst generatedTargets = ['.cursor/', '.github/prompts/', '.github/instructions/', '.codex/AGENTS.md', '.codex/config.toml', '.codex/agents/'];\nconst touchesGenerated = generatedTargets.some((target) => command.includes(target));\nconst touchesBaseline = command.includes('quality/baselines/') || command.includes('.quality/baseline');\nconst messages = [];\nif (touchesGenerated) messages.push('Vendor files are generated. Edit .ai/ first, then run pnpm ai:sync.');\nif (touchesBaseline) messages.push('Quality baseline changes require explicit human approval and must never add new findings automatically.');\nif (messages.length) {\n  console.log(JSON.stringify({\n    hookSpecificOutput: {\n      hookEventName: 'PreToolUse',\n      additionalContext: messages.join(' ')\n    }\n  }));\n}\n`);
  write(join(hooksDir, 'post_tool_use_quality_hint.mjs'), `#!/usr/bin/env node\nimport { execFileSync } from 'node:child_process';\nconst chunks = [];\nfor await (const chunk of process.stdin) chunks.push(chunk);\nlet changed = '';\ntry {\n  changed = execFileSync('git', ['diff', '--name-only'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });\n} catch {\n  process.exit(0);\n}\nconst files = changed.split('\\n').filter(Boolean);\nconst touchesSource = files.some((file) => /^(src|test|tools)\\//.test(file) || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.mjs'));\nconst touchesVendors = files.some((file) => /^(\\.cursor|\\.github|\\.codex|\\.agents)\\//.test(file));\nconst hints = [];\nif (touchesSource) hints.push('Source or test files changed. Run pnpm quality:fast before finishing.');\nif (touchesVendors) hints.push('Vendor adapter files changed. Prefer editing .ai/ and run pnpm ai:sync, then pnpm vendors:check.');\nif (hints.length) {\n  console.log(JSON.stringify({\n    systemMessage: hints.join(' ')\n  }));\n}\n`);
  write(join(paths.codex, 'hooks.json'), JSON.stringify({
    hooks: {
      PreToolUse: [
        {
          matcher: 'Bash|apply_patch|Edit|Write',
          hooks: [
            {
              type: 'command',
              command: 'node "$(git rev-parse --show-toplevel)/.codex/hooks/pre_tool_use_policy.mjs"',
              commandWindows: "powershell -NoProfile -ExecutionPolicy Bypass -Command \"node (Join-Path (git rev-parse --show-toplevel) '.codex/hooks/pre_tool_use_policy.mjs')\"",
              timeout: 30,
              statusMessage: 'Checking repository guardrails',
            },
          ],
        },
      ],
      PostToolUse: [
        {
          matcher: 'Bash|apply_patch|Edit|Write',
          hooks: [
            {
              type: 'command',
              command: 'node "$(git rev-parse --show-toplevel)/.codex/hooks/post_tool_use_quality_hint.mjs"',
              commandWindows: "powershell -NoProfile -ExecutionPolicy Bypass -Command \"node (Join-Path (git rev-parse --show-toplevel) '.codex/hooks/post_tool_use_quality_hint.mjs')\"",
              timeout: 30,
              statusMessage: 'Checking quality hints',
            },
          ],
        },
      ],
    },
  }, null, 2));
};

const syncCodex = () => {
  cleanDir(paths.codex);
  const agentEntries = syncCodexAgents();
  writeCodexHooks();
  const agentConfig = agentEntries
    .map((agent) => `[agents.${tomlString(agent.name)}]\ndescription = ${tomlString(agent.description)}\nconfig_file = ${tomlString(`agents/${agent.name}.toml`)}\n`)
    .join('\n');
  const mcpServers = JSON.parse(read(join(paths.ai, 'mcp.json'))).mcpServers;
  const mcpConfig = Object.entries(mcpServers).map(([name, server]) => {
    const key = /^[A-Za-z0-9_-]+$/.test(name) ? name : tomlString(name);
    const lines = [
      `[mcp_servers.${key}]`,
      `command = ${tomlString(server.command)}`,
      `args = ${tomlArray(server.args ?? [])}`,
    ];
    if (server.env && Object.keys(server.env).length) {
      lines.push('', `[mcp_servers.${key}.env]`);
      for (const [variable, value] of Object.entries(server.env)) {
        const envKey = /^[A-Za-z0-9_-]+$/.test(variable) ? variable : tomlString(variable);
        lines.push(`${envKey} = ${tomlString(value)}`);
      }
    }
    return lines.join('\n');
  }).join('\n\n');
  write(join(paths.codex, 'config.toml'), `# Project-specific Codex configuration.\n# Canonical workflow instructions live in AGENTS.md and .ai/.\n# User-specific model, provider, auth and approval settings should remain in ~/.codex/config.toml.\n\nproject_doc_max_bytes = 32768\n\n[agents]\nmax_threads = 6\nmax_depth = 1\njob_max_runtime_seconds = 1800\n\n${agentConfig}\n${mcpConfig}\n`);
  write(join(paths.codex, 'README.md'), `# Codex adapter\n\nThis directory is generated from .ai/ by \`pnpm ai:sync\`.\n\n## Contents\n\n- \`AGENTS.md\`: copy of the root project instruction contract.\n- \`config.toml\`: project-scoped Codex config with subagent limits and MCP servers.\n- \`agents/*.toml\`: Codex custom agents generated from .ai/agents.\n- \`hooks.json\` and \`hooks/*.mjs\`: lightweight repository guardrails for dangerous commands, generated vendor edits, and quality hints.\n\nDo not put personal credentials in this directory. Prefer environment variables and user-level Codex config.\n`);
  copyDir(join(root, 'AGENTS.md'), join(paths.codex, 'AGENTS.md'));
};

const hermesConfigYaml = `# Generated from .ai/ by pnpm ai:sync. Do not edit this file by hand.
# Project-scoped Hermes Agent example config. Copy into ~/.hermes/config.yaml
# (or point HERMES_HOME at this directory) and adjust provider and model.
#
# Secrets never belong here. Put API keys in ~/.hermes/.env as NOUS_API_KEY,
# OPENROUTER_API_KEY, etc. Hermes resolves \${VAR} references from that file.

model:
  default: Hermes-4-405B            # any Nous Portal / OpenAI-compatible model
  provider: nous                    # nous | openrouter | openai | anthropic | custom
  base_url: "https://inference-api.nousresearch.com/v1"
  api_key: "\${NOUS_API_KEY}"        # resolved from ~/.hermes/.env, never inline
  api_mode: chat_completions        # chat_completions | codex_responses | anthropic_messages
  context_length: 200000

agent:
  # This repository enforces cross-model QA: run the qa-cross-model skill with a
  # different provider/model than the one used to implement the change. Swap the
  # model block above (or use \`hermes model <provider:model>\`) for the QA pass.

skills:
  config:
    agent_workflow:
      path: ./.hermes/skills        # external skills dir projected from .ai/skills

terminal:
  backend: local                    # local | docker | ssh | modal | daytona | singularity
  cwd: "."
`;

const hermesReadme = `# Hermes Agent adapter

This directory is generated from .ai/ by \`pnpm ai:sync\`. Do not edit generated files here.
Edit the canonical source in .ai/ (or AGENTS.md) and regenerate.

## Contents

- \`config.yaml\`: secret-free example Hermes config (model provider, external skills dir, terminal backend).
- \`skills/\`: agentskills.io skills projected from .ai/skills. Compatible with Hermes taps and external skill dirs.
- \`AGENTS.md\`: copy of the root project instruction contract. Hermes auto-discovers it as project context.

## Use the skills

Two supported paths:

1. **Tap (publishable):** other Hermes users add this repository as a tap:

   \`\`\`bash
   hermes skills tap add maciker/agent-workflow-code-ts
   \`\`\`

2. **Local external directory:** point Hermes at the projected skills via config.yaml
   (\`skills.config.agent_workflow.path: ./.hermes/skills\`) or copy them into \`~/.hermes/skills/\`.

Skills appear in the system-prompt index, \`skills_list\`, \`skill_view\`, and as \`/<skill-name>\` slash commands.

## Configure the model

Set the provider and model in config.yaml or with \`hermes model <provider:model>\`. Put the matching API key in
\`~/.hermes/.env\` (for example \`NOUS_API_KEY=...\`). Never place secrets in config.yaml or in this directory.

See ../docs/hermes.md for the full setup guide.
`;

const syncHermes = () => {
  cleanDir(paths.hermes);
  const skillsTarget = join(paths.hermes, 'skills');
  cleanDir(skillsTarget);
  for (const skillDir of listDirs(join(paths.ai, 'skills'))) {
    copyDir(skillDir, join(skillsTarget, basename(skillDir)));
  }
  write(join(paths.hermes, 'config.yaml'), hermesConfigYaml);
  write(join(paths.hermes, 'README.md'), hermesReadme);
  copyDir(join(root, 'AGENTS.md'), join(paths.hermes, 'AGENTS.md'));
};

const syncVendorReadmes = () => {
  copyDir(join(root, 'AGENTS.md'), join(paths.ai, 'vendors', 'codex', 'AGENTS.md'));
  copyDir(join(root, 'AGENTS.md'), join(paths.ai, 'vendors', 'github-copilot', 'AGENTS.md'));
  write(join(paths.ai, 'vendors', 'cursor', 'README.md'), `# Cursor vendor adapter\n\nGenerated target: .cursor/.\n\nRun \`pnpm sync:ai\` to project canonical .ai assets into Cursor rules, agents, skills and MCP config.\n`);
  write(join(paths.ai, 'vendors', 'codex', 'README.md'), `# Codex vendor adapter\n\nGenerated target: .codex/ and .agents/skills.\n\nRoot AGENTS.md remains the primary instruction file for Codex. Codex custom agents and hooks are generated in .codex/.\n`);
  write(join(paths.ai, 'vendors', 'github-copilot', 'README.md'), `# GitHub Copilot vendor adapter\n\nGenerated target: .github/copilot-instructions.md, .github/instructions/, and .github/prompts/.\n\nCopilot does not map one-to-one to .ai/agents, so prompts and path-specific instructions are generated from the canonical workflow.\n`);
  copyDir(join(root, 'AGENTS.md'), join(paths.ai, 'vendors', 'hermes', 'AGENTS.md'));
  write(join(paths.ai, 'vendors', 'hermes', 'README.md'), `# Hermes Agent vendor adapter\n\nGenerated target: .hermes/config.yaml, .hermes/skills/, .hermes/AGENTS.md and .hermes/README.md.\n\nHermes Agent (Nous Research) consumes agentskills.io skills and AGENTS.md project context natively, so .ai/skills\nis projected as-is. The skills work both as a publishable tap (\`hermes skills tap add maciker/agent-workflow-code-ts\`)\nand as a local external skills directory. config.yaml is a secret-free example; API keys belong in ~/.hermes/.env.\n\nSee docs/hermes.md for setup.\n`);
};

const main = () => {
  if (!existsSync(paths.ai)) {
    throw new Error('Missing .ai directory. Run from repository root.');
  }
  syncSkills();
  syncCursor();
  syncGithub();
  syncCodex();
  syncHermes();
  syncVendorReadmes();
  console.log('AI vendor adapters synchronized: Cursor, Codex, GitHub Copilot, Hermes Agent');
};

main();
