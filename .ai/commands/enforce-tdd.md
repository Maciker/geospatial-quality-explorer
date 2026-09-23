Enforce the project TDD discipline.

Mode: $ARGUMENTS

Use this command when implementation drifted away from Red-Green-Refactor or when the next green step is unclear.

Workflow:
1. Stop the current implementation path.
2. Read `.ai/skills/xp-tdd-practices/SKILL.md`.
3. Read `.ai/skills/testing-standards/SKILL.md`.
4. If the mode is `tpp`, use the TPP table to select the lowest-numbered transformation that can make the current red test pass.
5. If the mode is `tdd` or omitted, reconstruct the example list, choose the simplest pending case, restore one failing test, implement the minimum production code, refactor after green, and re-evaluate.
6. Do not broaden scope.
7. Do not carry more than one failing test.

Output:
- current TDD phase
- selected case
- command run
- result
- next TDD step
