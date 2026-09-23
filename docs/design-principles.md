# Design Principles

The design rules are intentionally operational. They are used by agents during implementation, review, and refactoring.

## Core Rules

- Names are concrete, pronounceable, and in English.
- Functions do one thing and use guard clauses.
- Arity should stay between 0 and 3 parameters.
- Avoid boolean flags that change behavior.
- Use CQS: commands mutate, queries return values.
- Prefer immutable collection operations.
- Classes encapsulate behavior and avoid anemic models.
- Prefer composition over inheritance.
- No JS getters/setters or underscore-private naming.
- Use `DomainError` factory methods for domain failures.
- Return `Maybe.none()` for optional values instead of `null` or `undefined` when the project pattern is available.

## Refactoring

Use:

```text
/refactor
/refactor tests
/refactor rename
/refactor frontend
```

Refactor only when behavior is green, unless explicitly doing a structural spike.

See `.ai/skills/design-principles/SKILL.md` for the canonical rules.
