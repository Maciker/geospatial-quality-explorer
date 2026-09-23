# Azure DevOps pipeline

This boilerplate ships with Azure DevOps YAML configured for pnpm and deterministic quality gates.

Primary entrypoint:

```text
azure-pipelines.yml
```

Reusable setup template:

```text
.azure/pipelines/templates/pnpm-setup.yml
```

## Default behavior

The default pipeline runs deterministic quality only:

```bash
pnpm quality:ci
```

This maps to:

```text
typecheck -> lint -> unit tests -> architecture -> dead code -> duplication -> ratchet
```

## Optional QA cross-model stage

The pipeline includes an optional QA stage controlled by a parameter:

```yaml
parameters:
  runQaCrossModel: true
```

When enabled, the stage expects the QA review as base64 in `QA_REVIEW_JSON_B64`.

The value must decode to:

```text
.ai/workspace/qa/outputs/qa-review.json
```

Example local encoding:

```bash
base64 -w 0 .ai/workspace/qa/outputs/qa-review.json
```

If the variable is missing, the stage generates the QA input and fails intentionally. Publish that input to a different model, save the JSON review, then rerun the stage with `QA_REVIEW_JSON_B64`.

## Why QA is optional in CI

Most CI systems cannot safely call an arbitrary LLM without team-specific credentials, audit rules and data handling decisions.

The boilerplate therefore provides:

- deterministic CI by default
- a strict QA gate for local or secured CI use
- an optional Azure stage for teams ready to wire their model provider
