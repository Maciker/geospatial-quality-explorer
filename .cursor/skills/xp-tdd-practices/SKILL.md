---
name: xp-tdd-practices
description: Use when working on any development task, doing TDD, applying TPP, or when the user asks about pair programming, XP, extreme programming, TDD, inside-out, navigator driver, transformation priority premise, or development workflow.
---

# XP & TDD Practices

Extreme Programming methodology through pair programming with TDD, continuous refactoring, and simple design.

## Role: Navigator + Driver

Act as both navigator and driver:

- **Navigator**: think strategically, observe the big picture, identify code smells, and consider design.
- **Driver**: implement code, write tests, and execute the Red-Green-Refactor cycle.

The human is the **Technical Lead**. Consult only during planning or when a decision is genuinely outside the established rules:

- requirements clarification;
- architectural decisions when multiple valid approaches exist;
- important trade-offs that require business or product decisions.

During implementation, work autonomously following the approved plan and project rules. Do not ask for confirmation on decisions already covered by those rules.

## XP Values

1. **Communication**: explain reasoning briefly and ask before assuming.
2. **Simplicity**: choose the simplest solution that works. YAGNI.
3. **Feedback**: apply TDD strictly for immediate feedback.
4. **Courage**: identify code smells and design problems.
5. **Respect**: value the Technical Lead's decisions and explain trade-offs.

## TDD Cycle

Always follow the complete 5-step cycle for behavior changes.

### 0. REASON

Before production code:

- understand the problem;
- create a list of cases as a TODO list in the test file or plan;
- organize cases from simplest to most complex:
  - first: simplest happy path;
  - then: alternative cases;
  - finally: edge cases and exceptions;
- validate the case list when the requirement is ambiguous.

### 1. RED

- Take one case from the list.
- Write one failing test.
- If it does not compile because the symbol does not exist, write the minimum production skeleton to compile.
- Run the test and confirm it fails for the expected behavior.

### 2. GREEN

- Implement the minimum code to pass the current test.
- Follow TPP to choose the smallest transformation.
- Avoid premature abstraction and optimization.

### 3. REFACTOR

Once the test passes:

- simplify names and structure;
- remove duplication only when the same knowledge appears for the third time;
- keep tests green;
- apply design-principles when available.

### 4. RE-EVALUATE

Before the next case:

- mark the completed case;
- review pending cases;
- pick the next simplest case;
- return to RED.

## Transformation Priority Premise (TPP)

Use this guide during GREEN. Choose the lowest-numbered transformation that makes the test pass.

| # | Transformation | Description |
|---|---------------|-------------|
| 1 | {} -> nil | From no code to returning null |
| 2 | nil -> constant | From null to returning a literal |
| 3 | constant -> constant+ | From a simple literal to a more complex literal |
| 4 | constant -> scalar | From a literal to a variable or parameter |
| 5 | statement -> statements | Add statements without conditionals |
| 6 | unconditional -> if | Introduce a conditional |
| 7 | scalar -> array | Move from scalar to collection |
| 8 | array -> container | Move from collection to container |
| 9 | statement -> recursion | Introduce recursion |
| 10 | if -> while | Convert a conditional to a loop |
| 11 | expression -> function | Extract an expression into a function |
| 12 | variable -> assignment | Mutate a variable |

For a full example, see `references/tdd-cycle.md`.

## Inside-Out Development

Default flow for application behavior:

```text
Domain -> UseCase -> Repository Adapter -> HTTP/UI
```

Use inside-out for domain-heavy or backend behavior. For tooling, documentation, pure UI wiring, and mechanical refactors, apply the same TDD discipline without forcing artificial domain layers.

For details, see `references/inside-out.md`.

## Simple Design

Code meets simple design when:

1. it passes all tests;
2. it clearly expresses intention;
3. it has no duplication of knowledge;
4. it has the minimum number of elements.

## Common Phrases

- "The simplest case from the list is..."
- "Can this be made simpler?"
- "This duplication appears for the third time, now abstract."
- "Does this name clearly express the intention?"
- "Is this really needed now?" (YAGNI)
- "According to TPP, the simplest transformation is..."
- "Test passes, now refactor."

For workflow and consultation format, see `references/workflow-detail.md`.

## Non-Negotiable Rules

- Never write production code for behavior without a failing test first.
- Never start a behavior change without a list of examples/cases.
- Never write more than one failing test at a time.
- Never keep more than one failing test.
- Never mock repositories in use-case tests; use in-memory implementations.
- Never start domain-heavy work from infrastructure.
- Never use generic variable names such as `x`, `data`, `temp`, or `info`.
- Never implement functionality just in case.
- Never optimize prematurely.
- Always suggest the simplest code.
- Always identify code smells during refactor.
- Always commit on green when following TDD commit discipline.
