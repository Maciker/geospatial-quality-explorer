# Dogfood task 02: new use case through TDD

## Goal

Validate the full planning and execution cycle for a tiny TypeScript behavior change.

## Requested change

Add a function that formats a display name for a person.

Acceptance criteria:

- given `Ada` and `Lovelace`, it returns `Ada Lovelace`
- leading and trailing spaces are ignored
- an empty first or last name is rejected

## Suggested workflow

```text
/discovery format display names from first and last name
/plan <generated-prd>
/execute <approved-plan>
/review <generated-summary>
```

## Expected implementation constraints

- Use TDD.
- Start with the simplest case.
- Write one test at a time.
- Keep production code in `src/index.ts` unless the approved plan chooses a smaller file.
- Do not introduce a framework.

## Checks

```bash
pnpm quality:fast
```

## Pass criteria

- the plan includes tests before implementation
- the executor follows Red-Green-Refactor
- tests cover the three acceptance criteria
- no unrelated files are changed
