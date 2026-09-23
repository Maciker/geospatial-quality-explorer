# TypeScript migration plan

Owner instruction 2026-09-22: remove Python/FastAPI from all three GIS product repos, use TypeScript and import the agent workflow at 97d01f03436cbbf35936c172008e74e55be56dd5.

1. Preserve existing public behavior in characterization tests: health/findings for Quality, masked normalized difference for Territorial, balanced accuracy for Spatial ML.
2. Establish pnpm apps/packages workspace and a pinned coherent workflow snapshot.
3. Implement the existing behavior in TypeScript, remove Python runtime files and update callers/docs.
4. Run typecheck, lint, tests, build, architecture, dead-code, duplication, ratchet and regenerated-adapter checks over actual app paths.
5. Reconcile existing issues; add missing vertical slices with real dependencies and skills.
6. Obtain independent cross-model review; open a reviewable migration PR. Product MVP implementation remains in tickets.

Rollback: revert the migration PR as a unit. No production infrastructure or data migrations are executed by this change.
