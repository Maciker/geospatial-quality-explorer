# Task Workspace

A task workspace keeps long-running work compact and resumable.

## Location

```text
.ai/workspace/tasks/<task-id>/
  research.md
  discovery.md
  plan.md
  progress.md
  findings.md
  validation.md
  summary.md
  review.md
```

## Purpose

The task workspace prevents context rot:

- each phase produces a compact artifact;
- the next phase consumes the artifact, not the full conversation;
- long logs are summarized;
- decisions and blockers survive session resets.

## Recommended flow

```text
/task-research
/discovery
/plan
/execute
/compact-progress
/review
/validate
```

`/execute` writes `summary.md` at the end of execution; there is no separate summarize command.

Not every task needs every artifact. Small tasks may only need plan, validation and summary.

The directory is ignored by git. The plan's `Approval` section is the local record of human approval; reference the plan from the PR description so that approval remains visible after the workspace is cleaned.
