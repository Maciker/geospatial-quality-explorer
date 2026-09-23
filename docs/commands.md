# Commands

## Curated procedures

The canonical prompts `/to-spec`, `/to-tickets`, `/diagnose`, `/design-module`,
`/prototype`, `/triage`, `/resolve-conflicts` and `/review-skill` live in
`.ai/commands/`. See [curated-workflows.md](curated-workflows.md) for inputs,
outputs and tool-specific invocation limits.

Command files are reusable prompts. They are the stable interface humans invoke; commands delegate to agents or quality scripts.

| Command | Purpose | Profile |
| --- | --- | --- |
| `/repo-discovery` | Map an unfamiliar repository before task work begins. | Core |
| `/discovery` | Start Socratic problem analysis. | Core |
| `/plan` | Produce a checklist implementation plan. | Core |
| `/execute` | Execute an approved plan with TDD. | Core |
| `/review` | Review the implementation summary. | Core |
| `/qa` | Run independent cross-model QA review. | Core |
| `/quality` | Run deterministic checks. | Core |
| `/ratchet` | Check or initialize the ratchet. | Core |
| `/validate` | Run project validation through package scripts. | Core |
| `/code-review` | Review TypeScript implementation quality. | Core / optional |
| `/architecture-review` | Review architecture boundaries and dependency direction. | Core / optional |
| `/test-review` | Review test quality and coverage. | Core |
| `/frontend-review` | Review React components, hooks, CSS Modules, and store hooks. | React |
| `/functional-qa` | Browser acceptance QA plus E2E coverage audit. | Browser QA |
| `/ux-review` | Browser-based UX and responsive review. | Browser QA / React |

## Rule

Commands should not contain project encyclopedias. They should route work to the correct agent and define the expected input/output.

## v0.5 additions

- `/enforce-tdd`: recover TDD discipline or apply TPP.
- `/refactor`: perform behavior-preserving refactors.
- `/openspec-*`: optional OpenSpec profile commands.


## v0.7.5 additions

- `/repo-discovery`: read-only repository onboarding that writes `.ai/workspace/repo-analysis/*`.
