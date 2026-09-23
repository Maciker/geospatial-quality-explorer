# TDD Recovery and Refactor Commands

## `/enforce-tdd`

Use when implementation drifted away from the Red-Green-Refactor cycle.

```text
/enforce-tdd
/enforce-tdd tdd
/enforce-tdd tpp
```

It restores the example list, selects the simplest pending case, gets back to one red test, applies the minimum green step, and refactors only after green.

## `/refactor`

Use after a green test to improve code without changing behavior.

```text
/refactor
/refactor code
/refactor tests
/refactor rename
/refactor frontend
```

Rules:

- Behavior must already be green.
- Keep scope tight.
- Do not introduce behavior.
- Run the smallest relevant checks.
- Run `pnpm quality:fast` when shared code is touched.
