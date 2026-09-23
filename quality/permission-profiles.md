# Permission profiles

## discovery-writer

Can read the project and write PRDs under `.ai/workspace/prds/`.
Cannot edit production code or run mutating commands.

## planner

Can read the project and write plans under `.ai/workspace/plans/`.
Cannot edit production code or run mutating commands.

## implementer

Can read, edit, run tests and create commits after a plan is approved.
Must follow TDD and the approved checklist.

## readonly-reviewer

Can read the project and run safe inspection commands.
Cannot modify files.

## validation-runner

Can read the project and run package-script validation commands such as `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm quality:full`.
Can apply only safe mechanical fixes when explicitly requested.
Cannot perform broad refactors or change scope.

## browser-qa

Can read the project, run safe inspection commands, and use browser automation against a running application.
Cannot modify source files, tests, baselines, secrets, or credentials.
Must not capture, log, or persist real secret values in screenshots or reports.
