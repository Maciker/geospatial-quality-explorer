# Skill Curation

The boilerplate separates reusable knowledge from executable workflows.

## Categories

| Category | Location | Example |
|---|---|---|
| Knowledge skill | `.ai/skills/` | `testing-standards` |
| Specialized reviewer | `.ai/agents/` | `test-reviewer` |
| User-facing workflow | `.ai/commands/` | `/test-review` |
| Optional profile | `quality/profiles/` | `react` |

## Core skills

| Skill | Purpose |
|---|---|
| `xp-tdd-practices` | Development workflow, TDD, TPP, inside-out, simple design |
| `testing-standards` | Test pyramid, naming, AAA, mocks, integration/E2E policy |
| `git-strategy` | Feature branches, Conventional Commits, TDD commit discipline |
| `safe-refactoring` | Controlled refactors without behavior drift |
| `qa-review` | Semantic cross-model review expectations |

## Optional skills

| Skill | When to enable |
|---|---|
| `frontend-patterns` | React projects using CSS Modules and optional React Query store hooks |

## Rules

The curated knowledge additions are `codebase-design`, `domain-modeling`,
`diagnosing-bugs` and `writing-for-agents`. Their source decisions, overlap and
local adaptations are recorded in [source-intake.md](source-intake.md).

- Keep core small.
- Put framework-specific rules in profiles.
- Do not put full review workflows in skills; use agents and commands.
- Review agents are read-only. Executor applies fixes only from an approved plan.
- Adapt package-manager commands to the repo standard: this boilerplate uses `pnpm`.

## Deprecated aliases

`tdd` and `conventional-commits` are kept as compatibility aliases. Use `xp-tdd-practices` and `git-strategy` instead.
