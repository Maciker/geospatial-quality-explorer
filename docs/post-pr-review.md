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

The contract deliberately does not call GitHub, Cursor, Hermes or a model directly. This repository does not ship a provider adapter: whoever runs the review (a person or the agent) collects the evidence with the tools available and writes the portable JSON input. This keeps the state machine portable and makes provider limitations visible instead of silently bypassing the review.

Every field in the input is supplied by the caller. `pnpm pr:review` checks that the evidence is consistent and complete; it cannot prove that the evidence is true, so keep the commands you used and link them from the published review.

## Manual procedure with the GitHub CLI

Start from [`examples/post-pr-review/input.example.json`](../examples/post-pr-review/input.example.json) and fill it in:

1. PR identity and SHAs (`pr` and `current`; collect them again right before evaluating):

   ```bash
   gh pr view <number> --json number,url,baseRefOid,headRefOid
   ```

2. Diff (`diff`): review the complete diff and record its file list and digest.

   ```bash
   gh pr diff <number> > pr.diff
   gh pr view <number> --json files --jq '.files[].path'
   sha256sum pr.diff
   ```

3. Required checks (`checks`): use `complete` once every required check finished, `pending` while any runs, `failed` if any failed, and `none` only when the repository has no required checks.

   ```bash
   gh pr checks <number> --required --json name,state,bucket,link
   ```

4. Existing comments and reviews (`comments`, `reviews`); mark a `CHANGES_REQUESTED` review `resolved: true` only after its requests are addressed.

   ```bash
   gh pr view <number> --json comments,reviews
   ```

5. Independent review (`review`): run the read-only reviewer on a model different from the implementer and copy its `decision` and findings. Set `verified: true` only for identities you can name exactly; never invent them.

6. Evaluate, publish, evaluate again. The first run returns `PENDING` with `review_evidence_not_published` because nothing has been published yet:

   ```bash
   pnpm pr:review -- --input post-pr-review-input.json --report .ai/workspace/pr-reviews/post-pr-review.json
   ```

   Publish the reviewer's findings and the report as a PR review or comment, set `publication.status` to `published` and `publication.url` to its URL, then run the same command again. Only that second run can return `APPROVED`.
