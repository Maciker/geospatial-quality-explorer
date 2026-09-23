---
description: "Functional Qa workflow from agent-guardrails-ts"
---

# Functional Qa

Read AGENTS.md first. Then follow this workflow.

Use the `functional-qa` agent to test a running application against acceptance criteria.

Input: $ARGUMENTS

Rules:
- Requires a running app and browser automation.
- Convert requirements into acceptance criteria before testing.
- Check UI behavior, console errors, failed network requests, and E2E coverage.
- Do not create or modify tests unless explicitly requested.
