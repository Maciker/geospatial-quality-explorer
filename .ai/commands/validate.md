Use the `validator` agent to validate the current workspace.

Target: $ARGUMENTS

Default command sequence:
1. pnpm typecheck
2. pnpm lint
3. pnpm test
4. pnpm quality:full

Rules:
- Report failures clearly.
- Fix only safe mechanical issues when explicitly requested.
- Do not perform broad refactors.
