# Post-PR review

Run this command immediately after the agent creates a pull request and before anyone allows it to merge.

## Contract

- The review is part of the repository workflow, not a Cursor Automation, Bugbot, webhook or background vendor automation.
- Provider adapters must supply the PR URL/number, exact base/head SHAs, complete diff metadata, required checks, comments and existing reviews.
- The reviewer is read-only and must use a clean context.
- Use a provider/model different from the implementer whenever the identity can be verified.
- Never invent model or provider identities.
- A changed head SHA invalidates every previous post-PR review.
- Do not merge, deploy or auto-merge from this command.

## Invocation

Prepare a portable JSON input using the repository contract:

```bash
pnpm run pr:review -- --input <post-pr-review-input.json> --report <post-pr-review-report.json>
```

Use `--require-approved` only for a caller that must fail unless the result is `APPROVED`.

The input contract is documented in `quality/schemas/post-pr-review-input.schema.json`. The adapter must collect:

1. PR URL and number.
2. Exact base and head SHA.
3. Complete diff metadata and digest.
4. Required checks and their current state.
5. Existing comments and review states.
6. Independent read-only reviewer output.
7. Verifiable implementer/reviewer identities.
8. Publication status and durable evidence URL.

## State contract

- `APPROVED`: exact SHA matches, complete diff is reviewed, reviewer is verified and independent, required checks are complete and successful, evidence is published, and no actionable findings remain.
- `CHANGES_REQUESTED`: the reviewer or an existing reviewer has actionable findings. Return them to the implementer; after every push, create a new input and repeat the review against the new SHA.
- `PENDING`: required checks or durable publication are still pending. Never treat it as approval.
- `BLOCKED`: SHA changed, evidence is missing or stale, checks failed, reviewer identity is unverifiable/not independent, publication failed, or the reviewer returns `stop`.

## Review procedure

1. Read `AGENTS.md`, the relevant plan and PRD, `.ai/commands/post-pr-review.md`, `.ai/skills/qa-review/SKILL.md` and any architecture, security, testing, UX or domain skills relevant to the repository.
2. Review the complete PR diff in a clean read-only context.
3. Inspect checks, comments and existing reviews; do not ignore unresolved actionable review requests.
4. Invoke an independent reviewer and record the verified identity.
5. Run `pnpm run pr:review` with the collected input.
6. Publish the result through the available PR review/comment tool. Request changes only for actionable findings. Approve only when the reviewer is independent, the identity has permission to approve, all checks are complete and the state is `APPROVED`.
7. If the tool cannot publish, keep the durable report reference and leave the PR pending.
8. Do not mark the PR ready to merge while the state is `PENDING` or `BLOCKED`.
