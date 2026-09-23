---
description: "Quality workflow from agent-guardrails-ts"
---

# Quality

Read AGENTS.md first. Then follow this workflow.

Run repository quality gates.

Task: $ARGUMENTS

Default commands:

```bash
pnpm quality:fast
pnpm quality:full
```

For agent-generated changes, run:

```bash
pnpm qa:prepare -- --base origin/main --head HEAD
# get a cross-model review and save it to .ai/workspace/qa/outputs/qa-review.json
pnpm quality:agent
```

Rules:
- `quality:fast` must stay fast enough for local feedback.
- `quality:full` is deterministic and suitable for CI.
- `quality:agent` requires a real cross-model QA review.
- Do not replace deterministic gates with an LLM review.
