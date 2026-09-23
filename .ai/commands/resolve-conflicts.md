# Resolve Conflicts

Input: $ARGUMENTS (in-progress merge/rebase and intended result).

Inspect git status, unmerged paths and the operation in progress. Protect unrelated user work. Read both sides' commits and originating requirements, then resolve by intended behavior rather than blindly choosing ours/theirs. Regenerate generated adapters from canonical inputs after resolving `.ai/`.

Stage only files resolved for this operation. Run relevant checks and inspect the staged diff. Continue the merge/rebase only within the requested scope. If the intents conflict materially, report the unresolved decision; do not invent behavior or force completion. Do not discard unrelated work or abort an operation without authorization.

Record resolutions, trade-offs and validation in the task summary. Follow `git-strategy` for the resulting commit.
