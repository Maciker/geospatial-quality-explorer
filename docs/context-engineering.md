# Context Engineering

Context management is part of the workflow. The goal is to keep every agent session focused, auditable and cheap to verify.

## Principles

- Keep `AGENTS.md` small.
- Store durable knowledge in docs and artifacts, not only in chat.
- Do not pass full histories between phases.
- Do not paste long logs without summarizing them first.
- Prefer links, paths and compact evidence.

## Phase handoff

| Phase | Input | Output |
| --- | --- | --- |
| Repo onboarding | repository files | `.ai/workspace/repo-analysis/*` |
| Discovery | problem statement + repo facts | `.ai/workspace/tasks/<task-id>/discovery.md` |
| Planning | approved discovery | `.ai/workspace/tasks/<task-id>/plan.md` |
| Execution | approved plan | code changes + `.ai/workspace/tasks/<task-id>/summary.md` |
| Review | summary + diff | `.ai/workspace/tasks/<task-id>/review.md` |
| Validation | commands + evidence | `.ai/workspace/tasks/<task-id>/validation.md` |

## Context refresh rule

Start a clean context when:

- the slice changes;
- the plan has been approved and implementation begins;
- the conversation becomes log-heavy;
- the agent starts forgetting rules;
- the task moves from implementation to review.

The next session should receive only the relevant artifact plus paths to supporting docs.
