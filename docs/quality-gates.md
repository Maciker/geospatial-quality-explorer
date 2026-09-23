# Quality gates

Quality gates are split into three levels.

## `quality:fast`

Fast local feedback:

```bash
pnpm quality:fast
```

Runs:

```text
typecheck -> lint -> unit tests
```

Use this after small edits and before commits.

## `quality:full`

Deterministic integration feedback:

```bash
pnpm quality:full
```

Runs:

```text
quality:fast -> architecture -> dead code -> duplication -> ratchet
```

Use this before push and in CI.

## `quality:agent`

Agent-generated change validation:

```bash
pnpm quality:agent
```

Runs:

```text
quality:full -> qa:gate
```

This requires a real cross-model QA review at:

```text
.ai/workspace/qa/outputs/qa-review.json
```

Generate the QA input with:

```bash
pnpm qa:prepare -- --base origin/main --head HEAD
```

## Rule

Deterministic checks are hard gates. LLM review is a semantic gate. Do not use one as a replacement for the other.
