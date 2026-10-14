# AGENTS.md

This repository is geospatial-quality-explorer. It adopts the portable agent-workflow-code-ts workflow; project context is preserved below. This file is the current contract; version history lives in `CHANGELOG.md`.

## Operating principle

Agents may propose code and edit files. The workflow decides whether the work can continue.

Never treat an agent response as accepted until checks have passed and a human has reviewed the relevant output.

## Required workflow

1. Discovery before solution design. Use `/repo-discovery` first on an unfamiliar repository.
2. Plan before implementation.
3. Human approval before execution: the plan's `Approval` section names the approver; the executor does not start without it.
4. TDD for every logic change.
5. Commit on green; commit a refactor separately; never commit on red (see `git-strategy`).
6. Review after execution.
7. Run deterministic quality gates before opening or merging a PR.
8. For agent-generated changes, run cross-model QA before final approval.
9. Before opening an agent-generated PR, run `pnpm prepr:gate`; it validates the exact base/head SHA and that the declared reviewer and implementer models differ.
10. After creating a PR, run `pnpm pr:review` against the exact PR base/head SHA and keep the result out of merge-ready states until it is APPROVED.

## Commands

```bash
pnpm quality:fast
pnpm quality:full
pnpm qa:prepare -- --base origin/main --head HEAD --implementer-provider <provider> --implementer-model <model>
pnpm qa:run                     # reviewer from AI_QA_*; or save a review and run qa:record
pnpm qa:record -- --reviewer-provider <provider> --reviewer-model <model>
pnpm qa:gate
pnpm prepr:gate
pnpm pr:review -- --input <post-pr-review-input.json> --report <post-pr-review-report.json>
pnpm quality:agent
pnpm ai:sync && pnpm vendors:check   # after changing .ai/, AGENTS.md or vendor sync logic
```

## Done means

- The approved plan was followed.
- Tests were written before production code for logic changes.
- Typecheck, lint and tests pass.
- Architecture rules pass.
- The deterministic ratchet reports no new findings.
- Cross-model QA passes for agent-generated changes, with no blocking findings.
- `pnpm prepr:gate` passes against the exact current SHA with distinct reviewer and implementer identities; the PR states whether that evidence is `harness` or `declared`.
- `pnpm pr:review` returns `APPROVED` for the current PR SHA, with published evidence and no actionable findings.

## Skills

- `xp-tdd-practices`: behavior changes, the TDD cycle and TPP.
- `testing-standards`: writing or reviewing tests.
- `git-strategy`: branches and commits.
- `architecture-hexagonal`: module layout, dependency direction, ports/adapters and layer boundaries.
- `design-principles`: naming, functions, classes/modules, comments and error handling.
- `frontend-patterns`: React-profile tasks only.

## Context routing

- `.ai/commands/`: reusable task prompts. `/enforce-tdd` recovers the Red-Green-Refactor cycle, `/refactor` makes behavior-preserving changes after green, `/openspec-*` belong to the optional OpenSpec profile. `.ai/commands/pre-pr.md` is mandatory before the supported PR path; `.ai/commands/post-pr-review.md` is mandatory after PR creation.
- `.ai/agents/`: specialized agent instructions. Review agents are read-only; the executor applies fixes only from an approved plan.
- `.ai/skills/`: repeatable procedures.
- `.ai/workspace/tasks/<task-id>/`: discovery, plan, progress, summary and review for one task (see `docs/task-workspace.md`). Pass these compact artifacts between phases instead of whole chat histories.
- `.ai/workspace/qa/`: QA inputs and outputs for the current head.
- `.ai/workspace/repo-analysis/`: `/repo-discovery` output.
- `.ai/` is the canonical source. Vendor directories (`.cursor/`, `.codex/`, `.agents/`, `.github/instructions`, `.github/prompts`, `.github/copilot-instructions.md`, `.hermes/`) are generated; never edit them by hand.
- Keep this file small. Move details to `docs/`.

## Trust layers

1. Scope and artifact handoff.
2. Deterministic checks.
3. Ratchet.
4. Read-only review.
5. Cross-model QA.
6. Human approval.

## Do not

- Do not skip discovery for ambiguous work.
- Do not implement without an approved plan.
- Do not grow quality baselines automatically.
- Do not use the same model for implementation and QA, and do not invent model identities.
- Do not edit generated review reports to hide findings.
- Do not mix feature work, refactoring and formatting in the same commit.
- Do not introduce Bun-specific commands; this repository uses `pnpm`.


## GIS project contract

Project: geospatial-quality-explorer. Read docs/project-spec.md, docs/architecture.md and docs/roadmap.md.
All application logic, CLI and API code is TypeScript. No Python, FastAPI or PyQGIS runtime. QGIS desktop and PostGIS SQL remain GIS tools.
The owner requested migration of the existing scaffold and adoption of this workflow on 2026-09-22; that scope is authorized. Feature tickets have their own acceptance criteria and dependencies.
Use pnpm workspaces under apps/ and packages/. Canonical skills are in .ai/skills; regenerate all vendor adapters after edits.
OpenCode should read root AGENTS.md and the explicitly named skill/command files; automatic discovery is not assumed.
Keep numerical/spatial claims deterministic and preserve source data, CRS, NoData and provenance.

### Skill scope for this repository

- Always relevant: `gis-data-integrity` for rules, geometry, CRS, fixtures, storage and exports; plus the skills listed above, `domain-modeling` and `qa-review`.
- React work in `apps/web`: `frontend-patterns`; UI motion skills (`emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `animation-performance`, `find-animation-opportunities`, `animation-vocabulary`) only when the task is about that UI.
- Not applicable here (no mobile, Swift or native apps): `write-swift`, `mobile-native`, `animate-expo`, `apple-design`. They are kept for parity with the upstream workflow; do not load them.

## Publication boundary

Do not merge, deploy or enable auto-merge from the agent workflow.
