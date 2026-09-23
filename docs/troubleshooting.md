# Troubleshooting

This document lists common setup and workflow failures and the smallest useful fix.

## `pnpm` is not available

Use Corepack or install pnpm explicitly.

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
pnpm --version
```

## Git hooks are not running

Install hooks again:

```bash
pnpm setup:hooks
```

Verify Git is using the repository hook path:

```bash
git config core.hooksPath
```

Expected value:

```text
.githooks
```

## Vendor files are stale

Symptoms:

- `pnpm vendors:check` fails
- `.cursor/agents` does not match `.ai/agents`
- `.codex/agents` does not match `.ai/agents`
- GitHub prompt files are missing

Fix:

```bash
pnpm ai:sync
pnpm vendors:check
```

Edit `.ai/` first. Do not edit generated vendor files directly.

## Codex adapter check fails

Run:

```bash
pnpm ai:sync
pnpm codex:check
pnpm codex:skills:budget
```

Common causes:

- a new `.ai/agents/*.md` file was added but Codex agents were not regenerated
- `.codex/config.toml` was edited manually
- `.codex/AGENTS.md` differs from root `AGENTS.md`
- a hook file is missing the Node shebang

## Codex skills budget is too high

Run:

```bash
pnpm codex:skills:budget
```

Reduce the index by:

- shortening skill descriptions
- removing deprecated aliases from active skill directories
- moving vendor-specific knowledge to docs instead of skill descriptions
- keeping `SKILL.md` as an index and putting long examples under `references/`

## `quality:fast` fails on TypeScript

Run the checks separately:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Fix the first failing command before running the full pipeline again.

## `quality:full` fails on ratchet

Inspect:

```bash
cat .quality/ratchet-report.json
```

If this is the first baseline for a migrated project, initialize once:

```bash
pnpm quality:init
```

Do not add new findings to a baseline as part of normal work. Existing baselines may only shrink unless a human explicitly approves a baseline reset.

## `qa:gate` fails because no QA review exists

Strict QA requires:

```text
.ai/workspace/qa/outputs/qa-review.json
```

Create QA input first:

```bash
pnpm qa:prepare -- --base origin/main --head HEAD
```

Send it to a different model than the implementer, save the JSON response, then run:

```bash
pnpm qa:validate
pnpm qa:gate
```

Use `pnpm qa:gate -- --optional` only for local smoke tests where QA is not required yet.

## Dependency-cruiser reports architecture violations

Check the import direction.

Allowed direction:

```text
infrastructure -> application -> domain
```

Common fixes:

- move business logic out of infrastructure
- introduce a port before an adapter
- stop importing use cases from other modules
- move shared domain concepts to an explicit shared module

## Azure pipeline cannot find pnpm

The provided pipeline uses Corepack. If a hosted image changes behavior, add an explicit step:

```yaml
- script: corepack enable
  displayName: Enable Corepack
```

Then run:

```yaml
- script: pnpm install --frozen-lockfile
```

## Playwright MCP does not start

Check that Node can run the package:

```bash
npx -y @playwright/mcp@0.0.82 --help
```

If the environment blocks network access, install dependencies before starting the agent or disable Playwright MCP for that session.

## Context7 MCP cannot authenticate

Set the API key as an environment variable. Do not commit it.

```bash
export CONTEXT7_API_KEY=...
```

Then restart the vendor tool so it reloads MCP config.
