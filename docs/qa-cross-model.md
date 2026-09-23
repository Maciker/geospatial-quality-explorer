# Cross-model QA gate

The QA gate is the non-deterministic layer of the workflow. It does not replace typecheck, lint, tests, architecture checks or the ratchet.

Its job is to catch semantic problems that deterministic tools usually miss:

- wrong behavior even when tests pass
- missing edge cases
- weak or misleading tests
- unnecessary complexity
- architecture drift
- regression risk
- security or validation gaps

## Policy

The model that reviews the change must be different from the model that implemented it whenever possible.

The QA agent is read-only. It reviews the clean input and returns JSON. It does not patch code.

```text
score >= 80 + pass + no P0/P1 blockers -> continue
score 60-79 or iterate                 -> executor fixes and repeats
score < 60 or stop                     -> human decision required
```

## Local workflow

Generate the QA input:

```bash
pnpm qa:prepare -- --base origin/main --head HEAD
```

Send this file to a different model:

```text
.ai/workspace/qa/inputs/qa-input.md
```

Save the model response as JSON:

```text
.ai/workspace/qa/outputs/qa-review.json
```

When the model returns Markdown with a fenced JSON block, extract it:

```bash
pnpm qa:extract -- raw-qa-output.md --out .ai/workspace/qa/outputs/qa-review.json
```

Validate the schema:

```bash
pnpm qa:validate
```

Run the gate:

```bash
pnpm qa:gate
```

Run deterministic gates plus QA:

```bash
pnpm quality:agent
```

## Expected JSON

```json
{
  "score": 85,
  "decision": "pass",
  "summary": "The change matches the plan and tests cover the main behavior.",
  "blocking_findings": [],
  "missing_tests": [],
  "non_blocking_findings": [],
  "confidence": "high"
}
```

## Failure modes

`iterate` means the executor may continue, but only to address the listed findings.

`stop` means the agent must stop. A human must clarify intent, reduce scope or return to discovery.

A missing QA review fails `pnpm qa:gate` by default. Use `pnpm qa:gate -- --optional` only in CI jobs where QA is deliberately disabled.
