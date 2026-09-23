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
| Discovery | problem statement + repo facts | `.ai/workspace/prds/*` |
| Planning | approved discovery | `.ai/workspace/plans/*` |
| Execution | approved plan | code changes + `.ai/workspace/summaries/*` |
| Review | summary + diff | `.ai/workspace/reviews/*` |
| Validation | commands + evidence | validation summary |

## Context refresh rule

Start a clean context when:

- the slice changes;
- the plan has been approved and implementation begins;
- the conversation becomes log-heavy;
- the agent starts forgetting rules;
- the task moves from implementation to review.

The next session should receive only the relevant artifact plus paths to supporting docs.
