# Dogfood task 03: review-only flow

## Goal

Validate that review agents stay read-only and produce useful findings.

## Prompt

```text
Use the code-reviewer and test-reviewer to review the current diff against main.
Do not modify files.
Report findings with file, line, severity, why it matters, and suggested fix.
```

## Expected behavior

The agents should:

- inspect only the relevant changed files
- apply `design-principles` and `testing-standards`
- avoid broad or vague comments
- not write fixes
- not edit summaries, plans, code or tests

## Pass criteria

- no files are modified
- findings are concrete or the report says no issues were found
- any proposed fix is actionable and scoped
