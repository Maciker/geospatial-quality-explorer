# `.ai`

Canonical agent workflow configuration.

```text
agents/      specialized agent instructions
commands/    reusable slash-command prompts
skills/      focused procedures loaded when relevant
prompts/     long-form reusable prompts
templates/   artifact templates for tasks, domain notes and repository analysis
workspace/   generated task, QA and review artifacts (ignored by git)
vendors/     symlinks or adapter files for specific tools
mcp.json     MCP server configuration projected to Cursor and Codex
```

Generated artifacts:

```text
workspace/tasks/<task-id>/  discovery, plan (with approval), progress, summary, review per task
workspace/repo-analysis/    /repo-discovery output
workspace/qa/inputs/        clean QA prompt and exact-SHA context for cross-model review
workspace/qa/outputs/       QA JSON response and run manifest
workspace/pr-reviews/       local post-PR review reports
workspace/loop/             pnpm loop state and correction requests
```

OpenSpec commands (`/openspec-*`) are optional and belong to the `openspec` profile.
