# Contributing

This is a maintained workflow for agent-guided TypeScript development, not an application or a fully autonomous orchestrator.

## Start locally

Use Node.js 22 or 24 (the CI matrix) and pnpm 10.17.1 from package.json.

```bash
pnpm install --frozen-lockfile
pnpm doctor
pnpm setup:hooks
pnpm quality:fast
```

The package declares Node >=20; the public CI currently exercises 22 and 24.
The hooks require Bash. On Windows, use a compatible shell or run the checks manually.

## Change workflow

1. Read AGENTS.md. Clarify scope and agree a plan before production changes.
2. Work on a feature branch, not main. Use Conventional Commits.
3. For behavior changes, reproduce the problem with a failing test, implement the smallest fix, then refactor on green.
4. Edit canonical instructions in .ai/ or AGENTS.md. Do not hand-edit generated vendor files.
5. Run the checks below and include generated projections in the same PR.
6. Obtain an independent review and, for agent-generated changes, cross-model QA using a different model. Report unavailable validation honestly; never submit a mock review as evidence.

```bash
pnpm build
pnpm quality:full
pnpm quality:stabilization
git diff --check
```

quality:stabilization regenerates adapters. After committing, rerun it and check that git status is clean. vendors:check checks structure and selected secret patterns; it is not a byte-for-byte drift check or a complete secret scanner.

For QA, regenerate the input for the exact committed change before every review:

```bash
pnpm qa:prepare -- --base origin/main --head HEAD
pnpm qa:run -- --base origin/main --head HEAD --gate
pnpm quality:agent
```

Configure and export the AI_* variables described in .env.example before invoking qa:run. The current client reads process environment variables; copying a file to .env alone does not load them. qa:run reuses an existing input, so always run qa:prepare again after changing the diff. Review what will be sent before using an external model.

## Pull requests

Explain the problem, scope, relevant evidence, commands actually run and any untested integrations. Do not grow quality baselines, disable checks or broaden scope to make a PR green without explicit approval. Human review owns risk acceptance and merge decisions.

GitHub Actions runs deterministic checks and verifies regeneration leaves the checkout unchanged. It does not call paid models, start MCP servers or provide semantic QA.

## New instructions and dependencies

Follow docs/skill-intake-policy.md and docs/source-intake.md. Prefer improving an existing instruction over adding a duplicate. Preserve source attribution and license notices; do not copy unlicensed course materials or private project data.

MCP package versions are pinned in .ai/mcp.json. Update them deliberately, regenerate adapters and test the relevant runtime before claiming compatibility. Exact package pins do not lock every transitive dependency installed by npx.

## Publication

The repository may be public while package.json retains private: true. This intentionally prevents accidental npm publication.
See docs/public-release.md for the owner's publication checklist and SECURITY.md for safe disclosure.
