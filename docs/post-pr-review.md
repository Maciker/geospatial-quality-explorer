# Post-PR review

This is the portable review layer that runs after a PR is created and before a merge is allowed. It is part of the repository workflow and does not depend on Cursor Automations, Bugbot, webhooks or a background vendor service.

## Ownership

The provider adapter collects the PR snapshot and publishes the result. The repository state machine in `tools/pr/post-pr-review-state.mjs` decides whether the evidence is sufficient. A reviewer is read-only; the implementer handles fixes from an approved plan.

## Evidence contract

The adapter must capture:

- PR URL and number;
- exact base/head SHA;
- complete diff metadata and digest;
- required checks and current conclusions;
- comments and existing review states;
- independent reviewer output;
- verified implementer/reviewer identities;
- durable publication URL for the report.

The local JSON report is a reproducible cache, not the durable source of truth. The report must be published as a PR review/comment or another durable review artifact before the state can be `APPROVED`.

## State machine

| Status | Meaning | Merge allowed |
| --- | --- | --- |
| `APPROVED` | Exact SHA, complete evidence, independent reviewer, successful required checks, published report, no actionable findings. | Only after human approval. |
| `CHANGES_REQUESTED` | Actionable findings exist in the independent or existing review set. | No. |
| `PENDING` | Required checks or durable publication are still pending. | No. |
| `BLOCKED` | Stale SHA, missing evidence, failed checks, unverifiable reviewer, non-independent reviewer, publication failure or stop decision. | No. |

## Re-review

Any push changes the head SHA and invalidates the previous result. The agent must collect a new diff, checks and review input, then run:

```bash
pnpm pr:review -- --input <new-input.json> --report <new-report.json>
```

Do not approve or mark ready-to-merge while the result is `PENDING`, `BLOCKED` or `CHANGES_REQUESTED`.

## Provider adapters

The contract deliberately does not call GitHub, Cursor, Hermes or a model directly. Cursor, Hermes, Codex and other agents provide an adapter that reads their available PR tools and writes the portable JSON input. This keeps the state machine portable and makes provider limitations visible instead of silently bypassing the review.
