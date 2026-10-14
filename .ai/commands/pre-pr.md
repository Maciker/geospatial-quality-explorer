# Pre-PR gate

Use this command after the executor finishes an implementation and before any tool (Cursor, Codex, Copilot, Hermes or a person) opens a pull request. It is mandatory for agent-generated changes.

## Contract

- The QA reviewer is read-only and must use a clean context.
- Review the exact base and head SHAs recorded by pnpm qa:prepare.
- Use a different provider/model from the implementer. Identities are compared as lowercase `provider:model`.
- Name both identities exactly. If you cannot name the implementer or the reviewer model, stop and report that limitation; do not call the result cross-model QA.
- A source/test change after QA invalidates the report. Run qa:prepare again.
- Do not use paid overage, raise limits, merge, deploy or auto-merge.

## Identity evidence

The gate records how the identities were obtained:

- `harness`: `pnpm qa:run` called the reviewer provider configured in `AI_QA_*`, so the reviewer identity comes from that call.
- `declared`: a person or agent typed both identities with `pnpm qa:record`. The gate checks they differ; it cannot prove which model produced the review.

The implementer identity is always declared: no tool can observe which model wrote the code. Run `pnpm prepr:gate -- --require-harness` (or set `QA_REQUIRE_HARNESS=1`) when a team accepts only `harness` evidence.

## Sequence

1. Read AGENTS.md, the task plan, .ai/prompts/qa-cross-model.md, .ai/agents/qa-cross-model.md and .ai/skills/qa-review/SKILL.md.
2. Run the deterministic checks required by the repository, at least:

   pnpm quality:full

3. Capture the exact diff and working-tree snapshot, declaring the model that implemented the change:

   pnpm qa:prepare -- --base origin/main --head HEAD --implementer-provider <implementer-provider> --implementer-model <implementer-model>

   Use the real base ref for the branch when it is not origin/main. Do not guess model names. `AI_PROVIDER`/`AI_MODEL` configure the harness client and are not used as the implementer identity.
4. Get the review with one of these paths:
   - Harness (recommended when API keys are available): set `AI_QA_PROVIDER`/`AI_QA_MODEL` to a model different from the implementer and run `pnpm qa:run`. It writes the review and the run manifest; continue at step 7.
   - Subagent or second tool: invoke the `qa-cross-model` subagent with a fresh context, or paste `.ai/workspace/qa/inputs/qa-input.md` into another tool. Subagents inherit the session model by default in Cursor and Codex, so select a different model before invoking it. It must return only the documented JSON review and must not edit files.
5. For the subagent path, save the JSON response to .ai/workspace/qa/outputs/qa-review.json, then validate it:

   pnpm qa:validate

6. For the subagent path, record both identities:

   pnpm qa:record -- --reviewer-provider <provider> --reviewer-model <model> --implementer-provider <provider> --implementer-model <model>

   If either identity is unknown, stop instead of fabricating metadata.
7. Run the strict pre-PR gate:

   pnpm prepr:gate

   This checks the exact head SHA, the working-tree snapshot, the QA-input digest, distinct identities, schema and QA decision. Any entry in `blocking_findings` fails the gate. A passing qa:gate alone is not sufficient.
8. If the decision is iterate, apply only the listed fixes, at most two rounds. After every fix repeat steps 2–7. If the decision is stop, a blocking finding remains after two rounds, deterministic checks fail, or the independent model is unavailable, stop and return control to the human.
9. Only after pnpm prepr:gate passes may the tool open the pull request through its supported PR-creation action. Include the commands, exact models, identity evidence (`harness` or `declared`), score/decision and limitations. Do not merge or deploy.
10. Immediately after the PR is created, invoke `.ai/commands/post-pr-review.md`. The post-PR reviewer must inspect the complete PR diff, checks, comments and existing reviews, then run `pnpm pr:review` against the exact PR base/head SHA. Do not mark the PR ready to merge while the result is `PENDING`, `BLOCKED` or `CHANGES_REQUESTED`.

The gate protects the supported workflow path. A vendor or external integration that creates a PR without running this command may bypass it and must be documented as outside the covered path.

## PR description

Use repository-root `docs/pr-descriptions.md` after the gate passes. Describe resulting behavior, provide relevant before/after evidence, reference the approved plan, and state rollback difficulty and affected consumers. Scale detail to the change; a diagram is optional and never replaces verification. Preserve the repository's existing PR template and exact-SHA review evidence.
