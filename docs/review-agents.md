# Review Agents

Review agents provide focused, read-only validation. They do not change files.

## Agents

| Agent | Scope | Profile |
|---|---|---|
| `code-reviewer` | TypeScript implementation quality | Core, pending `design-principles` |
| `architecture-reviewer` | Layer boundaries and dependency direction | Core, pending `architecture-hexagonal` |
| `test-reviewer` | Test quality and coverage | Core |
| `frontend-reviewer` | React components, hooks, CSS Modules, store hooks | React |
| `functional-qa` | Browser acceptance testing and E2E coverage audit | Browser QA |
| `ux-reviewer` | Visual UX and responsive checks | Browser QA / React |
| `validator` | Package-script validation | Core |

## Commands

```text
/code-review <scope>
/architecture-review <scope>
/test-review <scope>
/frontend-review <scope>
/functional-qa <prd-or-flow>
/ux-review <screen-or-flow>
/validate <target>
```

## Read-only policy

Review agents may read files and run safe commands. They must not edit files, update baselines, commit, or apply fixes.

When a reviewer finds a blocker:

```text
review finding -> plan fix -> human approval -> executor implements -> review again
```

## Severity

| Severity | Meaning |
|---|---|
| P0 | Must stop; serious correctness, security, or data-loss risk |
| P1 | Must fix before merge |
| P2 | Should fix or explicitly accept |
| P3 | Non-blocking improvement |

## Pending dependencies

Two reviewers reference skills that may arrive in a later phase:

- `architecture-reviewer` -> `architecture-hexagonal`
- `code-reviewer` -> `design-principles`

Until those skills exist, the agents still use the checks embedded in their own instructions.

## v0.5 additions

- Architecture reviews use `architecture-hexagonal`.
- Code reviews use `design-principles`.
