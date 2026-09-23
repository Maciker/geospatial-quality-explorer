Use the `repository-analyst` agent.

Scope: $ARGUMENTS

Goal:
Analyze this repository for the first time before any implementation work.

Rules:
- Read-only.
- Do not modify production code.
- Do not propose implementation changes yet.
- Do not run destructive commands.
- Do not install dependencies unless explicitly approved.
- Prefer inspecting existing files before asking questions.
- If a command may be expensive or unsafe, ask before running it.

Analyze:
1. Repository structure.
2. Main languages and frameworks.
3. Build, test, lint and validation commands.
4. Existing CI/CD.
5. Architecture and module boundaries.
6. Documentation and decision records.
7. Generated files and protected areas.
8. Risks, unknowns and missing context.
9. Recommended updates to `AGENTS.md`.

Output:
Create files under `.ai/workspace/repo-analysis/`:

- `repo-map.md`
- `validation-map.md`
- `architecture-map.md`
- `risk-map.md`
- `agent-onboarding.md`
- `suggested-agents-update.md`

If the repository is too large, analyze the top-level structure first and create a follow-up checklist instead of trying to inspect everything in one pass.
