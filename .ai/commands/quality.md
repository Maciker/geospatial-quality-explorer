Run repository quality gates.

Task: $ARGUMENTS

Default commands:

```bash
pnpm quality:fast
pnpm quality:full
```

For agent-generated changes, follow `.ai/commands/pre-pr.md`. The short form is:

```bash
pnpm qa:prepare -- --base origin/main --head HEAD --implementer-provider <provider> --implementer-model <model>
# either: pnpm qa:run (reviewer from AI_QA_*), or save a different model's JSON review to
# .ai/workspace/qa/outputs/qa-review.json and record it:
pnpm qa:record -- --reviewer-provider <provider> --reviewer-model <model>
pnpm quality:agent
```

Rules:
- `quality:fast` must stay fast enough for local feedback.
- `quality:full` is deterministic and suitable for CI.
- `quality:agent` runs `quality:full` and `prepr:gate`; it fails without a recorded cross-model QA run.
- Do not replace deterministic gates with an LLM review.
