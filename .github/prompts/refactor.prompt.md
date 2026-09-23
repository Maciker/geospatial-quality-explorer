---
description: "Refactor workflow from agent-guardrails-ts"
---

# Refactor

Read AGENTS.md first. Then follow this workflow.

Refactor without changing behavior.

Mode: $ARGUMENTS

Supported modes:
- empty or `code`: refactor production code
- `tests`: refactor tests
- `rename`: rename the specified or most recent artifact
- `frontend`: refactor frontend code against the optional React profile

Workflow:
1. Confirm the relevant behavior is green before editing. If it is not green, stop and ask whether this is a structural spike.
2. For code mode, read `.ai/skills/design-principles/SKILL.md`.
3. For tests mode, read `.ai/skills/testing-standards/SKILL.md`.
4. For frontend mode, read `.ai/skills/frontend-patterns/SKILL.md`.
5. Keep edits behavior-preserving and tightly scoped.
6. Do not introduce new behavior.
7. Run the smallest relevant test command.
8. Run `pnpm quality:fast` when shared code is touched.

Output:
- refactor mode
- files changed
- behavior-preserving changes made
- checks executed
- remaining risks
