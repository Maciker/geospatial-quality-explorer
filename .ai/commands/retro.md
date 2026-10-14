# Session retrospective

Input: $ARGUMENTS (session or task artifact pointers).

1. Read AGENTS.md, the session's plan, summary, validation and review artifacts, and the full `retro` and `writing-for-agents` skills.
2. Identify observed failures or repeated friction. State missing evidence rather than assuming access to vendor session logs.
3. Inspect current checks, CI, instructions and relevant profiles. Separate missing checks from checks that exist but are not wired.
4. Produce a small prioritized report under `.ai/workspace/tasks/<task-id>/retro.md`: evidence, cause, proposed environment change, verification and limits. A successful session may justify no changes.
5. Report recommendations only. Accepted changes use the canonical plan/executor path and existing authorization; do not automatically change feature scope, global configuration or external systems.
