---
name: design-principles
description: This skill should be used when writing or reviewing code, refactoring, or when the user asks about "naming", "functions", "classes", "comments", "error handling", or "code design".
---

# Design Principles

For interface design or shallow abstractions, load the repository's `codebase-design` skill. Keep the hexagonal rules and existing domain vocabulary when comparing alternatives.

Code design standards covering naming, functions, classes/modules, comments, and error handling.

## Naming

- Pronounceable in English, no technical abbreviations.
- Avoid redundant prefixes/suffixes such as `I`, `Impl`, or `Abstract`.
- Use concrete names; avoid catch-all words such as helper, util, or manager.
- Do not include type information in names; the IDE shows it.
- One concept, one name; avoid aliases or synonyms.
- Combine well with grammar: `isPaidInvoice`, `sumOfNumbersIn(expression)`.
- Prefer `not` in the name over the negation operator when it improves readability.
- Distinguish nouns (classes, modules) from verbs (methods, functions).
- Allowed generic suffixes: DTO, Repository, Factory, Mapper, UseCase, Service.
- Constants use camelCase, not SCREAMING_SNAKE_CASE.
- Never use underscore prefixes for private members.
- Prefer enums over literal types for fixed sets of values.

For full naming rules with examples, see `references/naming.md`.

## Functions

1. Single responsibility: each function does exactly what its name indicates.
2. Impeccable naming: function names are verbs describing the action.
3. Minimum arity: 0-3 parameters; group in an object if exceeded.
4. No boolean flags: prefer specific functions such as `show()` and `hide()`.
5. Guard clauses: exit early for edge cases and reduce indentation.
6. Separate control flow and logic: extract iterations and branches.
7. Declarative style: use `map`, `filter`, or `reduce` when it improves readability.
8. Pure functions: avoid side effects when possible.
9. CQS: commands mutate and return void; queries return values and do not mutate.
10. No comments on functions: no JSDoc or parameter descriptions.
11. Prioritize immutable collections: avoid `push`, `pop`, `shift`, and `splice`.
12. Constants stay close to usage.
13. Use `Maybe<T>` for optionals: never return `| undefined` or `| null` when the project pattern is available.

For full function rules with code examples, see `references/functions.md`.

## Classes and Modules

1. Minimum scope, maximum cohesion.
2. Simple constructors: move validation to factory methods; keep constructors as assignment.
3. Class organization: public constructor, then private constructor, then public API, then private methods.
4. Encapsulation by default: use `private`; do not export unless necessary.
5. Law of Demeter and Tell, Don't Ask.
6. Rich models: classes encapsulate behavior; avoid anemic models.
7. Complete objects at construction; no partial initialization.
8. No JavaScript getters/setters; use explicit methods or readonly properties.
9. No underscore prefixes; use the `private` keyword.
10. No singletons; manage global state through the Factory module.
11. Composition over inheritance.
12. Domain-specific types with behavior.

For full class/module rules with examples, see `references/classes-modules.md`.

## Comments and Formatting

- Code must be self-explanatory; comments often indicate unclear code.
- Comment WHY, never WHAT.
- No JSDoc and no parameter descriptions.
- Delete commented-out code; version control exists.
- Let formatter and linter handle formatting.
- Production code should avoid blank lines inside functions unless readability clearly requires it.
- Tests require AAA blank lines between Arrange, Act, and Assert.

## Error Handling

Use a single `DomainError` class with factory methods:

| Factory Method | Type | Use |
|----------------|------|-----|
| `createNotFound()` | notFound | Entity does not exist |
| `createValidation()` | validation | Invariant violated |
| `create()` | other | Other domain errors |

- Throw for invariant violations, entity not found, and invalid state transitions.
- Return `Maybe.none()` for optional values; return an empty array for no results.
- Include relevant context in error messages.
- Never expose stack traces, DB table names, file paths, or implementation details.
- Distinguish domain errors from technical errors; let technical errors bubble up.

For the full DomainError pattern with code examples, see `references/error-handling.md`.

## Non-Negotiable Rules

- Never write production code without self-explanatory names.
- Never use generic variable names such as `x`, `data`, `temp`, or `info`.
- Never use boolean flags that change function behavior.
- Never expose internal collections directly.
- Never use JS getters/setters or underscore prefixes.
- Never expose stack traces or internal details in error messages.
- Always use factory methods for `DomainError`.
- Always follow CQS: commands mutate, queries return.
- Always prefer composition over inheritance.
