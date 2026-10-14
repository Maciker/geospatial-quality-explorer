---
description: "Post Pr Review workflow from agent-guardrails-ts"
---

# Post Pr Review

Read AGENTS.md first. Then follow this workflow.

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
pnpm pr:review -- --input <post-pr-review-input.json> --report <post-pr-review-report.json>
```

Use `--require-approved` only for a caller that must fail unless the result is `APPROVED`.

The input contract is documented in `quality/schemas/post-pr-review-input.schema.json`; start from `examples/post-pr-review/input.example.json`. No provider adapter ships with this repository: collect the evidence with the available PR tools (see the GitHub CLI procedure in `docs/post-pr-review.md`). Collect:

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
4. Invoke an independent reviewer and record its exact identity; never invent one.
5. Run `pnpm pr:review` with `publication.status: "pending"`. Expect `PENDING` (`review_evidence_not_published`) unless another blocker appears first.
6. Publish the review through the available PR review/comment tool. Request changes only for actionable findings.
7. Set `publication.status: "published"` and `publication.url`, refresh `current` SHAs and check states, and run `pnpm pr:review` again. Approve only when the reviewer is independent, the identity has permission to approve, all checks are complete and this second run returns `APPROVED`.
8. If the tool cannot publish, keep the local report reference and leave the PR pending.
9. Do not mark the PR ready to merge while the state is `PENDING`, `BLOCKED` or `CHANGES_REQUESTED`.
