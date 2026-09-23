---
description: "Qa workflow from agent-guardrails-ts"
---

# Qa

Read AGENTS.md first. Then follow this workflow.

Use the agent `qa-cross-model` to review the current change with a clean context.

Task: $ARGUMENTS

Workflow:
1. Generate the QA input with `pnpm qa:prepare -- --base <base-ref> --head <head-ref>`.
2. Send `.ai/workspace/qa/inputs/qa-input.md` to a different model than the implementer.
3. Save the JSON response to `.ai/workspace/qa/outputs/qa-review.json`.
4. Run `pnpm qa:gate`.
5. If the gate fails with `iterate`, ask the executor to fix only the blocking findings.
6. If the gate fails with `stop`, return control to the human.

Do not edit code during QA. QA is read-only.
