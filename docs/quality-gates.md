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
pnpm qa:prepare -- --base origin/main --head HEAD --implementer-provider <provider> --implementer-model <model>
pnpm qa:record -- --reviewer-provider <provider> --reviewer-model <model>
pnpm prepr:gate
```

`pnpm qa:gate` validates the review JSON; `pnpm prepr:gate` additionally checks SHA, input and working-tree integrity and that the reviewer and implementer identities differ. It does not run the deterministic checks: `pnpm quality:agent` runs `quality:full` and then `prepr:gate`. Identities recorded with `qa:record` are declared, not machine-verified; `pnpm qa:run` records the reviewer identity from its provider call (see `.ai/commands/pre-pr.md`).

## Post-PR review

After a PR is created, the portable post-PR review is a separate gate:

```bash
pnpm pr:review -- --input <post-pr-review-input.json> --report <post-pr-review-report.json>
```

It returns exactly one of `APPROVED`, `CHANGES_REQUESTED`, `PENDING` or `BLOCKED`. The input must contain the exact PR base/head SHA, a complete diff snapshot, required checks, comments, existing reviews, exact implementer/reviewer identities and durable publication evidence. All of it is supplied by the caller; see the manual procedure in `docs/post-pr-review.md`. Any new push invalidates the result and requires a fresh input and review. Only `APPROVED` is eligible for human merge consideration; this workflow never merges, deploys or auto-merges.

## Rule

Deterministic checks are hard gates. LLM review is a semantic gate. Do not use one as a replacement for the other.
