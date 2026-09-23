# `.ai`

Canonical agent workflow configuration.

```text
agents/      specialized agent instructions
commands/    reusable slash-command prompts
skills/      focused procedures loaded when relevant
prompts/     long-form reusable prompts
workspace/   generated PRDs, plans, summaries, reviews and QA artifacts
vendors/     symlinks or adapter files for specific tools
mcp.json     optional MCP server configuration
```

Generated artifacts:

```text
workspace/prds/       discovery outputs
workspace/plans/      approved or proposed plans
workspace/summaries/  executor summaries
workspace/reviews/    human or agent review reports
workspace/findings/   additional finding reports
workspace/qa/inputs/  clean QA prompts for cross-model review
workspace/qa/outputs/ QA JSON responses
workspace/qa/reports/ QA gate reports
```

## v0.5

Core skills added:

- `architecture-hexagonal`
- `design-principles`

Commands added:

- `/enforce-tdd`
- `/refactor`
- `/openspec-explore`
- `/openspec-propose`
- `/openspec-apply-change`
- `/openspec-archive-change`

OpenSpec is optional and belongs to the `openspec` profile.
