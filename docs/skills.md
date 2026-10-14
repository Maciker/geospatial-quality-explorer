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

## Design and frontend skills (optional)

The following skills are available for UI work. Use only the ones that match the task and the project's framework.

| Skill | Use when |
| --- | --- |
| `animate` | Designing or implementing web motion and transitions |
| `animation-performance` | Diagnosing dropped frames, costly animation properties or per-frame rendering; web-only |
| `break-ui` | Stress-testing UI against realistic worst-case data; includes `CATALOG.md` and executor-owned dev fixtures |
| `animate-expo` | Building or debugging animation in React Native or Expo |
| `animation-vocabulary` | Finding the name of a described animation effect |
| `apple-design` | Reviewing or designing gesture-driven, spring-based web UI |
| `ask-sonner` | Implementing or troubleshooting Sonner toasts in React |
| `emil-design-eng` | Improving UI craft, component polish, and interaction details |
| `find-animation-opportunities` | Read-only discovery of useful places for motion |
| `improve-animations` | Read-only audit and prioritized motion improvement plan |
| `mobile-native` | Fixing mobile web, touch, viewport, or PWA behavior |
| `pick-ui-library` | Explicitly invoked selection of a frontend library |
| `ui-prototype` | Explicitly invoked comparison of live UI variants; imported upstream as `prototype` |
| `review-animations` | Explicitly invoked, read-only animation review |
| `write-swift` | Writing, reviewing, or debugging Swift |

`ui-prototype` is distinct from the existing `/prototype` command, which records experiment evidence and runs the repository's guarded prototyping workflow. The selected animation or UI prototype is handed to canonical `/plan` and `/execute`; audit and review skills do not replace approval, TDD, review, deterministic quality, or cross-model QA gates. Source revisions and license details are in [source intake](source-intake.md) and [third-party notices](../THIRD_PARTY_NOTICES.md).

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
| `retro` | User-requested retrospective based on session evidence; propose improvements to checks, navigation and tooling |

`grill-me` is the user-started entry point for `grilling`.

These are reusable disciplines. User-started procedures remain in `.ai/commands/`.
See [the workflow guide](curated-workflows.md) and [source decisions](source-intake.md).

## Packaging

A skill teaches how to behave. A command starts a workflow. An agent executes or reviews a workflow in an isolated role.

See `docs/skill-curation.md` for the curation rules.

## v0.5 additions

- `architecture-hexagonal`: core module/layer/ports-and-adapters rules.
- `design-principles`: core naming/function/class/error-handling rules.

## Design and frontend skills (optional)

The following skills are available for UI work. Use only the ones that match the task and the project's framework.

| Skill | Use when |
| --- | --- |
| `animate` | Designing or implementing web motion and transitions |
| `animate-expo` | Building or debugging animation in React Native or Expo |
| `animation-vocabulary` | Finding the name of a described animation effect |
| `apple-design` | Reviewing or designing gesture-driven, spring-based web UI |
| `ask-sonner` | Implementing or troubleshooting Sonner toasts in React |
| `emil-design-eng` | Improving UI craft, component polish, and interaction details |
| `find-animation-opportunities` | Read-only discovery of useful places for motion |
| `improve-animations` | Read-only audit and prioritized motion improvement plan |
| `mobile-native` | Fixing mobile web, touch, viewport, or PWA behavior |
| `pick-ui-library` | Explicitly invoked selection of a frontend library |
| `ui-prototype` | Explicitly invoked comparison of live UI variants; imported upstream as `prototype` |
| `review-animations` | Explicitly invoked, read-only animation review |
| `write-swift` | Writing, reviewing, or debugging Swift |

`ui-prototype` is distinct from the existing `/prototype` command, which records experiment evidence and runs the repository's guarded prototyping workflow. The selected animation or UI prototype is handed to canonical `/plan` and `/execute`; audit and review skills do not replace approval, TDD, review, deterministic quality, or cross-model QA gates. Source revisions and license details are in [source intake](source-intake.md) and [third-party notices](../THIRD_PARTY_NOTICES.md).
