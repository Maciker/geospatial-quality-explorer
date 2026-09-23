# Dogfood task 01: small refactor

## Goal

Validate that the refactor workflow can improve code without changing behavior.

## Starting point

Use the current `src/index.ts` and `test/index.test.ts` files.

## Prompt

```text
Use /refactor code on src/index.ts.
Keep behavior unchanged.
Run the smallest relevant test command.
Do not modify generated vendor files.
```

## Expected behavior

The agent should:

- read `AGENTS.md`
- read `.ai/commands/refactor.md`
- keep the change small
- avoid adding new behavior
- run the focused test or `pnpm test`
- report what changed and what checks were run

## Pass criteria

- tests still pass
- `greet("Ada")` still returns `Hello, Ada`
- no vendor files under `.cursor/`, `.codex/`, `.github/` or `.agents/` are edited directly
