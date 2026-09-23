---
name: git-strategy
description: Use when working with git, creating commits, branching, feature branches, conventional commits, or TDD commit discipline.
---

# Git Strategy

Feature branching workflow with Conventional Commits and TDD-driven commit discipline.

## Branching Model

All work happens on feature branches created from `main`.

```text
main
  feat/add-user-registration
  fix/login-validation-error
  refactor/extract-payment-module
```

## Branch Naming

Format: `<type>/<short-description>`.

| Type | Use case |
|------|----------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring without behavior change |
| `chore` | Tooling, config, dependencies |
| `docs` | Documentation only |
| `test` | Adding or fixing tests only |

Rules:

- lowercase and hyphens only;
- no underscores or camelCase;
- max 50 characters for the description part;
- concise but meaningful.

## Conventional Commits

Format:

```text
<type>(<scope>): <description>
```

- `type`: required.
- `scope`: optional business module or component.
- `description`: imperative, lowercase, no final period, max 50 characters.

Types:

| Type | When to use |
|------|-------------|
| `feat` | New user-visible functionality |
| `fix` | Bug fix |
| `refactor` | Neither fix nor feature |
| `test` | Add or correct tests |
| `chore` | Build, config, tooling |
| `docs` | Documentation |
| `style` | Formatting only |

Examples:

```text
feat(user): add registration endpoint
fix(auth): validate token expiry
refactor(payment): extract discount calculator
test(order): add empty cart case
chore: update typescript
```

## TDD Commit Discipline

Commit on every green test. This creates a fine-grained, reversible history.

```text
RED      -> write failing test -> no commit
GREEN    -> make test pass     -> commit
REFACTOR -> improve code       -> commit if changed
```

Decision guide:

- First green test that introduces new behavior -> `feat`.
- Green test that fixes a bug -> `fix`.
- Additional cases for the same behavior -> `test`.
- Refactoring after green -> `refactor`.
- Test helpers or infrastructure -> `test`.

## Non-Negotiable Rules

- Never commit on red.
- Never skip commits after green when doing TDD.
- Never write long commit messages.
- Never use past tense or gerunds in commit descriptions.
- Never commit directly to `main`.
- Always use Conventional Commits.
- Always create feature branches from `main`.
- Always use imperative mood.
