# Dogfooding guide

Use this guide to validate the boilerplate as a real user would use it. The goal is not to add functionality; the goal is to prove that installation, vendor adapters, hooks, quality gates and agent workflows are usable from a clean checkout.

`pnpm dogfood:check` checks files, metadata and adapter structure only. The complete manual checklist below also requires live execution; the structural check alone is not end-to-end evidence.

## Scope

This phase validates:

- fresh install
- Git hooks
- vendor sync for Cursor, Codex and GitHub Copilot
- Codex custom agents and hook configuration
- deterministic quality gates
- ratchet initialization and normal execution
- cross-model QA preparation and gate behavior
- example tasks that exercise the workflow

## Clean checkout checklist

Start from a clean clone or an extracted release archive.

```bash
pnpm install
pnpm setup:hooks
pnpm ai:sync
pnpm vendors:check
pnpm codex:check
pnpm codex:skills:budget
pnpm dogfood:check
pnpm quality:fast
pnpm quality:full
```

If this is the first run in a new repository or migrated project, initialize baselines once:

```bash
pnpm quality:init
```

After initialization, use the normal ratchet command:

```bash
pnpm quality:ratchet
```

## Vendor validation

Run:

```bash
pnpm quality:vendor
pnpm quality:codex
```

Expected result:

- `.cursor/` exists and matches `.ai/`
- `.codex/agents/*.toml` exists for every `.ai/agents/*.md`
- `.github/prompts/*.prompt.md` exists for every command that is exposed to Copilot
- `.agents/skills/` matches `.ai/skills/`
- no literal secrets are found in generated vendor files

If vendor files are stale, run:

```bash
pnpm ai:sync
```

Commit both `.ai/` and generated vendor files if the project policy is to keep adapters versioned.

## Agent workflow smoke test

Use the example tasks in `examples/tasks/`.

Recommended order:

1. `01-small-refactor.md`
2. `02-new-usecase.md`
3. `03-review-only.md`
4. `04-qa-cross-model.md`

For each task, check that the agent:

- reads `AGENTS.md`
- uses the matching command or subagent
- keeps changes small
- runs focused validation
- does not modify generated vendor files directly
- does not grow quality baselines automatically

## Cross-model QA smoke test

Prepare QA input:

```bash
pnpm qa:prepare -- --base origin/main --head HEAD
```

If no real QA JSON exists yet, the strict gate should fail and the optional gate should not block:

```bash
pnpm qa:gate -- --optional
```

For a real run, save a review JSON to:

```text
.ai/workspace/qa/outputs/qa-review.json
```

Then run:

```bash
pnpm qa:validate
pnpm qa:gate
```

## Release checklist

Before publishing a new release archive:

```bash
pnpm ai:sync
pnpm dogfood:check
pnpm quality:vendor
pnpm quality:codex
pnpm quality:fast
```

Run `pnpm quality:full` in a fully installed local environment before tagging.

## Pass criteria

The release is considered stable when:

- the repository installs from scratch
- generated vendors pass checks
- Codex skill budget is under the configured threshold
- hooks install successfully
- `quality:fast` passes
- `quality:full` passes locally or documented failures are actionable
- example tasks can be followed without inventing missing workflow steps
