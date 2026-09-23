# Dogfood task 05: vendor sync guardrail

## Goal

Validate that `.ai/` remains the canonical source and vendor files are generated, not hand-edited.

## Prompt

```text
Add a small note to the planner agent explaining that it must keep plans implementation-ready.
Edit only the canonical source and regenerate vendor projections.
```

## Expected behavior

The agent should:

- edit `.ai/agents/planner.md`
- run `pnpm ai:sync`
- run `pnpm vendors:check`
- avoid direct manual edits under `.cursor/agents`, `.codex/agents`, `.github/prompts` or `.agents/skills`

## Pass criteria

- canonical `.ai/agents/planner.md` contains the change
- generated vendor files reflect the change
- vendor checks pass
