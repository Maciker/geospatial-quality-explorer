Use the `task-researcher` agent.

Task: $ARGUMENTS

Goal:
Research the specific task before technical planning.

Rules:
- Read-only.
- Do not edit files.
- Do not implement.
- Do not propose broad refactors.
- Prefer inspecting existing code and docs before asking.
- Keep facts separate from hypotheses.

Output:
Create or update:

`.ai/workspace/tasks/<task-id>/research.md`

The research must include:
1. Task summary.
2. Relevant files and why they matter.
3. Current behavior.
4. Existing tests.
5. Facts.
6. Hypotheses.
7. Risks.
8. Open questions.
9. Planning notes.

This command is different from `/repo-discovery`:
- `/repo-discovery` maps the repository.
- `/task-research` investigates a specific task area.
