# Skills

Skills are small, focused knowledge packs. They are loaded when relevant and should not become workflow engines.

## Core skills

- `xp-tdd-practices`: XP workflow, TDD cycle, TPP, inside-out development, simple design.
- `testing-standards`: test pyramid, naming, AAA, mocks policy, integration and E2E guidance.
- `git-strategy`: branch naming, Conventional Commits, TDD commit discipline.
- `safe-refactoring`: controlled refactoring practices.
- `qa-review`: semantic review expectations.

## Optional skills

- `frontend-patterns`: strict React, custom hooks, CSS Modules, and React Query store conventions.

## Deprecated aliases

- `tdd` -> use `xp-tdd-practices`.
- `conventional-commits` -> use `git-strategy`.

## Curated additions

| Skill | Use when |
| --- | --- |
| `codebase-design` | Comparing module interfaces or identifying shallow abstractions |
| `domain-modeling` | Resolving domain terminology, invariants and durable decisions |
| `diagnosing-bugs` | Building a reproduction and testing causes before a fix |
| `writing-for-agents` | Authoring focused instructions and context pointers |
| `grilling` | Stress-testing a plan, decision or idea before acting |

`grill-me` is the user-started entry point for `grilling`.

These are reusable disciplines. User-started procedures remain in `.ai/commands/`.
See [the workflow guide](curated-workflows.md) and [source decisions](source-intake.md).

## Packaging

A skill teaches how to behave. A command starts a workflow. An agent executes or reviews a workflow in an isolated role.

See `docs/skill-curation.md` for the curation rules.

## v0.5 additions

- `architecture-hexagonal`: core module/layer/ports-and-adapters rules.
- `design-principles`: core naming/function/class/error-handling rules.
