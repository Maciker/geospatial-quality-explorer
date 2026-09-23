# agent-workflow-code-ts

A portable workflow for agent-guided TypeScript development: clarify the problem,
design small changes, implement with feedback, and verify the result.

Maintained by Iker Macaya from hands-on development and training. Selected
practices from Matt Pocock's skills and the `ai-learnings` collection are adapted
to this repository's contracts, with [source attribution](THIRD_PARTY_NOTICES.md).

Start with the [workflow guide](docs/curated-workflows.md), the
[source intake matrix](docs/source-intake.md), or the quickstart below.

This repository is not an application. It is a **workflow system**: a canonical
set of agent instructions, commands, skills and policies in `.ai/`, projected
into vendor-specific adapters, and backed by deterministic quality gates and a
model-agnostic execution harness. The operating principle is simple:

> Never treat an agent response as accepted until checks have passed and a human
> has reviewed the relevant output.

See [`AGENTS.md`](AGENTS.md) for the full contract.

## Quickstart

```bash
pnpm install
pnpm setup:hooks        # install pre-commit / pre-push hooks
pnpm quality:fast       # typecheck + lint + test
```

Point the workflow at your model provider with `AI_*` environment variables (see
[`.env.example`](.env.example)); the AI client in `tools/ai/` is provider-agnostic.

## Repository layout

```text
.ai/            canonical source: agents, commands, skills, policies, templates, mcp.json
.cursor/        generated Cursor adapter (rules, agents, skills, mcp)
.codex/         generated Codex adapter (config, agents, hooks)
.github/        generated GitHub Copilot adapter (instructions, prompts)
.agents/        generated portable agentskills.io skills
.hermes/        generated Hermes Agent adapter (skills, config.yaml, context)
.githooks/      git hooks
tools/          executable harness + quality/vendor/qa/sandbox tooling
quality/        quality gate config, baselines, profiles
docs/           documentation
src/, test/     example TypeScript package
```

`.ai/` is the single source of truth. Vendor directories are **generated** — edit
`.ai/` (or `AGENTS.md`) and run `pnpm ai:sync`, then `pnpm vendors:check`.

## Workflow

1. Discovery before solution design (start with `/repo-discovery` on an unfamiliar repo).
2. Plan before implementation.
3. Human approval before the executor changes production code.
4. TDD for behavior changes.
5. Review after implementation (read-only review agents).
6. Cross-model QA for agent-generated changes.
7. Deterministic quality gates before opening or merging a PR.

## Common commands

For spec writing, vertical tickets, bug diagnosis, module design, prototypes and
triage, see the [task-to-command guide](docs/curated-workflows.md). These procedures
reuse the existing execution and review gates.

```bash
pnpm quality:fast        # typecheck + lint + test
pnpm quality:full        # + architecture, dead-code, duplication, ratchet
pnpm ai:sync             # regenerate vendor adapters from .ai/
pnpm vendors:check       # verify vendor adapters are in sync
pnpm quality:vendor      # sync + vendor check
pnpm quality:codex       # validate the Codex adapter
pnpm qa:prepare          # build a clean cross-model QA input from the diff
pnpm qa:gate             # evaluate a cross-model QA review
pnpm dogfood:check       # check scaffold and adapter structure
pnpm doctor              # environment diagnostics
```

## Vendor adapters

The same canonical workflow is projected into each tool's native format: Cursor,
Codex, GitHub Copilot, portable agentskills.io skills, and Hermes Agent. See
[`docs/vendors.md`](docs/vendors.md) and [`docs/hermes.md`](docs/hermes.md). Do not
edit generated vendor files by hand.

## Version additions

The full history is in [`CHANGELOG.md`](CHANGELOG.md). Highlights:

### v0.8.0 additions

- Executable, model-agnostic harness: provider-agnostic AI client (`tools/ai/`),
  self-correction loop (`tools/loop/`), and git-worktree sandbox (`tools/sandbox/`).
- Hermes Agent vendor adapter (`.hermes/`): agentskills.io skills as a tap or
  external directory, secret-free `config.yaml`, `AGENTS.md` context.
- Path reconciliation to intended dotted names so the sync, checks, hooks and
  vendor tools run from a clean checkout.
- Package-family framing (`docs/package-family.md`, `docs/split-architecture.md`).
- Dogfooding guide and `pnpm dogfood:check`.

### v0.7.6 additions

- Task workspace for long-running, resumable work.
- Task research before planning; context manager and progress compaction for
  long sessions; agent-behavior and concise-communication policies.

### v0.7.5 additions

- Repository onboarding via `/repo-discovery` and the repository-analyst agent.
- Layered trust model and context budget policies.

### v0.7.4 additions

- Risk-based review layers and read-only review agents.
- Human-in-the-loop responsibilities, skill intake policy, and Codex hardening.

### v0.7.2 additions

- Cross-platform hardening: Windows-safe path handling in findings and reports.

## Contributing and publication

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and the
[public-release checklist](docs/public-release.md). GitHub CI runs deterministic
checks and rejects adapter regeneration drift; independent cross-model QA and
human review remain separate requirements. `package.json` intentionally retains
`private: true` to prevent accidental npm publication, not public GitHub access.

## License

Released under the [MIT License](LICENSE). Third-party attribution and notices
are in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
