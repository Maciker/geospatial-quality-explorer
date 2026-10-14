# AGENTS.md

This repository is a guardrails boilerplate for agent-guided TypeScript development.

## Operating principle

Agents may propose code and edit files. The workflow decides whether the work can continue.

Never treat an agent response as accepted until checks have passed and a human has reviewed the relevant output.

## Required workflow

1. Discovery before solution design.
2. Plan before implementation.
3. Human approval before execution.
4. TDD for every logic change.
5. Commit after each completed Red-Green-Refactor cycle.
6. Review after execution.
7. Run deterministic quality gates before opening or merging a PR.
8. For agent-generated changes, run cross-model QA before final approval.

## Commands

```bash
pnpm quality:fast
pnpm quality:full
pnpm qa:prepare -- --base origin/main --head HEAD
pnpm qa:gate
pnpm quality:agent
```

## Done means

- The approved plan was followed.
- Tests were written before production code for logic changes.
- Typecheck, lint and tests pass.
- Architecture rules pass.
- The deterministic ratchet reports no new findings.
- Cross-model QA passes for agent-generated changes.
- The review report contains no blocking issues.

## Context routing

- Use `.ai/commands/` for reusable task prompts.
- Use `.ai/agents/` for specialized agent instructions.
- Use `.ai/skills/` for repeatable procedures.
- Store generated PRDs, plans, summaries and reviews under `.ai/workspace/`.
- Store QA inputs and outputs under `.ai/workspace/qa/`.
- Keep this file small. Move details to `docs/`.

## Do not

- Do not skip discovery for ambiguous work.
- Do not implement without an approved plan.
- Do not grow quality baselines automatically.
- Do not use the same model for implementation and QA when another model is available.
- Do not edit generated review reports to hide findings.
- Do not mix feature work, refactoring and formatting in the same commit.


## v0.4 Skill Policy

- Use `xp-tdd-practices` for behavior changes.
- Use `testing-standards` when writing or reviewing tests.
- Use `git-strategy` for branches and commits.
- Enable `frontend-patterns` only for React-profile tasks.
- Review agents are read-only; fixes go through planner + executor.
- This repository uses `pnpm`; do not introduce Bun-specific commands.


## v0.5 Core Skills

Use these skills when relevant:

- `architecture-hexagonal`: module layout, dependency direction, ports/adapters, domain/application/infrastructure boundaries.
- `design-principles`: naming, functions, classes/modules, comments, and error handling.
- `xp-tdd-practices`: implementation cycle and TPP.
- `testing-standards`: test naming, AAA, FIRST, pyramid, mocks, integration and E2E strategy.
- `git-strategy`: feature branches, conventional commits, and commit-on-green discipline.

## v0.5 Commands

- `/enforce-tdd`: recover the Red-Green-Refactor cycle or apply TPP.
- `/refactor`: behavior-preserving refactor after green.
- `/openspec-*`: optional OpenSpec profile commands.

Review agents are read-only. They produce findings. The executor applies fixes only from an approved plan.

## v0.6 Vendor Adapters

`.ai/` is the canonical source. Vendor directories are generated projections.

Run after changing `.ai/`, `AGENTS.md`, or vendor sync logic:

```bash
pnpm ai:sync
pnpm vendors:check
```

Generated targets:

- Cursor: `.cursor/rules`, `.cursor/agents`, `.cursor/skills`, `.cursor/mcp.json`.
- Codex: `.codex/config.toml`, `.codex/AGENTS.md`, `.agents/skills`.
- GitHub Copilot: `.github/copilot-instructions.md`, `.github/instructions`, `.github/prompts`.
- Hermes Agent: `.hermes/config.yaml`, `.hermes/skills`, `.hermes/AGENTS.md`, `.hermes/README.md`.

Do not edit generated vendor files by hand. Edit the canonical source and regenerate.

## v0.7.5 Repository Onboarding And Trust Model

Use `/repo-discovery` before applying the workflow to an unfamiliar repository. It maps structure, validation commands, architecture, risks and suggested `AGENTS.md` updates under `.ai/workspace/repo-analysis/`.

Trust is layered:

1. Scope and artifact handoff.
2. Deterministic checks.
3. Ratchet.
4. Read-only review.
5. Cross-model QA.
6. Human approval.

Context is managed by artifacts. Do not pass entire chat histories between phases when a compact PRD, plan, summary or review artifact exists.


## GIS project contract

Project: geospatial-quality-explorer. Read docs/project-spec.md, docs/architecture.md and docs/roadmap.md.
All application logic, CLI and API code is TypeScript. No Python, FastAPI or PyQGIS runtime. QGIS desktop and PostGIS SQL remain GIS tools.
The owner requested migration of the existing scaffold and adoption of this workflow on 2026-09-22; that scope is authorized. Feature tickets have their own acceptance criteria and dependencies.
Use pnpm workspaces under apps/ and packages/. Canonical skills are in .ai/skills; regenerate all vendor adapters after edits.
OpenCode should read root AGENTS.md and the explicitly named skill/command files; automatic discovery is not assumed.
Keep numerical/spatial claims deterministic and preserve source data, CRS, NoData and provenance.

### Skill scope for this repository

- Always relevant: `gis-data-integrity` for rules, geometry, CRS, fixtures, storage and exports; plus the v0.5 core skills above, `domain-modeling` and `qa-review`.
- React work in `apps/web`: `frontend-patterns`; UI motion skills (`emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `animation-performance`, `find-animation-opportunities`, `animation-vocabulary`) only when the task is about that UI.
- Not applicable here (no mobile, Swift or native apps): `write-swift`, `mobile-native`, `animate-expo`, `apple-design`. They are kept for parity with the upstream workflow; do not load them.


## Mandatory pre-PR cross-model QA

Before any agent or vendor tool (Cursor, Codex, Claude Code, Copilot, Hermes) opens a PR for agent-generated changes:

1. Run the deterministic checks required by this repository, including `pnpm quality:full`.
2. Run `pnpm qa:prepare` against the exact base/head SHA and clean worktree snapshot.
3. Invoke `qa-cross-model` read-only with a fresh context and a verifiable model identity distinct from the implementer.
4. Record and validate the JSON report, then run `pnpm prepr:gate`.
5. Stop on `stop`, P0/P1, failed deterministic checks/tests, or unavailable independent model. Limit correction rounds to two and repeat the gate after every change.
6. Do not open a PR if the report, SHA, input hash, worktree snapshot or model evidence is missing. A direct GitHub/API/vendor PR route may bypass this local workflow gate and is outside its coverage.

## Mandatory post-PR review

After creating a PR, invoke the portable post-PR review workflow and run `pnpm run pr:review -- --input <post-pr-review-input.json> --report <post-pr-review-report.json>` against the exact base/head SHA. Use a verified independent reviewer when the provider exposes that identity. Repeat after every push; do not mark a PR ready to merge while the result is `PENDING`, `BLOCKED` or `CHANGES_REQUESTED`. Never merge, deploy or auto-merge from the agent workflow.
