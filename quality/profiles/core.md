# Core Profile

Use this profile for any TypeScript package or application.

## Enabled skills

- `xp-tdd-practices`
- `testing-standards`
- `git-strategy`
- `safe-refactoring`
- `qa-review`

## Enabled agents

- `debater`
- `planner`
- `executor`
- `reviewer`
- `test-reviewer`
- `validator`
- `qa-cross-model`
- `security-reviewer`
- `maintainer-filter`

## Quality levels

```text
quality:fast  -> typecheck + lint + tests
quality:full  -> fast + architecture + dead code + duplication + ratchet
quality:agent -> full + cross-model QA gate
```

## Notes

This profile does not assume React, a browser, a backend framework, or a database.

## v0.5 Core Additions

The core profile includes:

- `architecture-hexagonal`
- `design-principles`
- `/enforce-tdd`
- `/refactor`

These are part of the default workflow because architecture and design reviews depend on them.
