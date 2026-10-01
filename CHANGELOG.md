# Upstream workflow changelog

The entries below belong to the imported agent-workflow-code-ts snapshot, not releases of this GIS product. See docs/workflow-provenance.json.

# Changelog

## Unreleased

- Added thirteen optional design and frontend skills from Emil Kowalski's reviewed MIT source, with generated vendor projections and attribution.

- Curated six knowledge skills and nine workflow commands from reviewed
  learning sources, with explicit source revisions and MIT attribution.
- Added spec, ticket, diagnosis and domain-document templates; extended existing
  testing, safe-refactoring, research, review and handoff guidance.
- Added optional MCP adapter guidance and a representative workflow exercise.
- Added the `grill-me` interview flow and a root MIT license for public reuse.

All notable changes to `agent-workflow-code-ts` are documented here.

This project is a guardrails boilerplate for agent-guided TypeScript development.
The canonical source of the workflow lives in `.ai/`; vendor directories
(`.cursor/`, `.codex/`, `.github/`, `.agents/`, `.hermes/`) are generated
projections. See `docs/` for detail on each area.

> Note: the early history of this repository was imported as squashed uploads,
> so version entries below are reconstructed from the repository's own
> documentation and code rather than from tagged releases. Dates are omitted
> where they are not known.

## 0.8.0

Executable, model-agnostic layer and vendor reconciliation.

- Executable harness: model-agnostic AI client (`tools/ai/`) with pluggable
  provider adapters configured purely from `AI_*` environment variables, a
  self-correction loop (`tools/loop/verify-and-iterate.mjs`) and an isolated
  git-worktree sandbox (`tools/sandbox/run-in-sandbox.mjs`).
- Hermes Agent vendor adapter: `.ai/` is projected into `.hermes/` (agentskills.io
  skills usable as a tap or external directory, secret-free `config.yaml`,
  `AGENTS.md` context). See `docs/hermes.md`.
- Path reconciliation: the canonical source and every vendor projection now use
  their intended dotted names (`.ai/`, `.cursor/`, `.codex/`, `.github/`,
  `.agents/`, `.hermes/`, `.githooks/`) so the sync, checks, hooks and vendor
  tools work from a clean checkout.
- Package family framing: `docs/package-family.md`, `docs/split-architecture.md`
  and `docs/typescript-package.md` describe this package as the TypeScript layer
  of a broader workflow family.
- Dogfooding: `docs/dogfooding.md` and `pnpm dogfood:check` validate that a clean
  checkout is usable end to end (scripts, docs, vendor adapters, hooks).
- New scripts: `quality:vendor`, `quality:codex`, `quality:stabilization`,
  `codex:skills:budget`.

## 0.7.6

Task workspace and context engineering.

- Task workspace for long-running, resumable work (`docs/task-workspace.md`,
  `.ai/templates/tasks/`).
- Task research before planning (`docs/task-research.md`,
  `.ai/agents/task-researcher.md`, `.ai/commands/task-research.md`).
- Progress compaction and a context manager for long sessions
  (`docs/progress-compaction.md`, `.ai/agents/context-manager.md`,
  `.ai/commands/compact-progress.md`).
- Agent-behavior and concise-communication policies
  (`docs/agent-behavior.md`, `docs/concise-communication.md`,
  `quality/profiles/context-engineering.md`).

## 0.7.5

Repository onboarding and trust model.

- `/repo-discovery` onboarding flow and the repository-analyst agent map an
  unfamiliar repository before the workflow is applied
  (`docs/repository-onboarding.md`, `.ai/commands/repo-discovery.md`,
  `.ai/agents/repository-analyst.md`, `.ai/templates/repo-analysis/`).
- Layered trust model and context budget policies
  (`docs/trust-model.md`, `.ai/policies/trust-model.md`,
  `.ai/policies/context-budget.md`).

## 0.7.4

Review layers and human-in-the-loop guardrails.

- Risk-based review layers and read-only review agents (`docs/review-layers.md`).
- Human-in-the-loop responsibilities for scope, decisions and risk acceptance
  (`docs/human-in-the-loop.md`).
- Skill intake policy to keep the skill set intentional (`docs/skill-intake-policy.md`).
- Codex hardening profile for custom agents, hooks and skill budget
  (`docs/codex-hardening.md`).

## 0.7.2

Cross-platform hardening.

- Windows-safe path handling: findings and reports normalize paths with
  `path.basename()` and `path.relative()` to avoid absolute-path leakage
  (`docs/windows-troubleshooting.md`).
