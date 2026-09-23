# Prototype

Input: $ARGUMENTS (one design uncertainty).

State the question and what observation would answer it. Use an isolated local artifact for logic/state exploration or a temporary route in a scratch branch for UI alternatives. Follow existing tooling and make relevant state visible. Keep persistence local and disposable.

Time-box the experiment in the task plan. Add only what makes the question testable; do not expand into authentication, deployment or production hardening. The repository's implementation gates apply before any prototype-derived code becomes production code.

Record the setup, observations, verdict, limitations and source branch/artifact in `.ai/workspace/tasks/<task-id>/prototype.md`. Keep experimental code out of the production change. Do not delete the only copy of evidence; retain an authorized reference before cleanup.
