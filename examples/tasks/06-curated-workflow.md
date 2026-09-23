# Curated workflow exercise

## Goal

Practice turning an agreed feature into a spec and independently verifiable work without opening tracker issues or changing production code.

Scenario: an existing task list already creates and displays tasks. Users need to complete a task; repeating completion should leave it complete, and an unknown task should produce a defined not-found result. Persistence and UI conventions must be discovered in the target project.

Read `/to-spec` and `/to-tickets` from `.ai/commands/`. Write local artifacts in `.ai/workspace/tasks/complete-task/`. Use existing interfaces where possible; record what requires repository discovery instead of inventing framework choices.

## Pass criteria

- The spec covers normal completion, repeated completion and an unknown identifier.
- A slice verifies an observable outcome through the existing caller-facing interface.
- Tickets are not mechanically split into database/API/UI layers.
- Blocking edges resolve to real local ticket files, are acyclic, and expose ready work.
- No issue, comment, label, dependency installation or production change occurs.
- The report distinguishes unresolved discovery from execution-ready work.

## Neighboring case

For a one-line README typo, none of the domain-modeling, diagnosing-bugs or codebase-design skills should trigger. Do not introduce a glossary, prototype or issue graph for that request.
