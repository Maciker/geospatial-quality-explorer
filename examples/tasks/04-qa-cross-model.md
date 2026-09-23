# Dogfood task 04: cross-model QA gate

## Goal

Validate the QA preparation and gate behavior.

## Setup

Create or keep a small diff in the repository.

## Prepare QA input

```bash
pnpm qa:prepare -- --base origin/main --head HEAD
```

Generated input:

```text
.ai/workspace/qa/inputs/qa-input.md
```

## Prompt for the second model

Send the generated QA input to a different model than the implementer and ask it to return only valid JSON matching `quality/schemas/qa-review.schema.json`.

Save the response to:

```text
.ai/workspace/qa/outputs/qa-review.json
```

## Validate

```bash
pnpm qa:validate
pnpm qa:gate
```

## Pass criteria

- `qa:prepare` creates a clean standalone input
- `qa:validate` rejects malformed JSON
- `qa:gate` blocks score below policy thresholds
- `qa:gate` passes only when the review decision and blocking findings allow it
