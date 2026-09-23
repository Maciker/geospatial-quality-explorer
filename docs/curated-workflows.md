# Using the curated workflow

This repository is Iker Macaya's maintained TypeScript workflow: shared instructions in `.ai/`, generated adapters, and executable quality gates. Training stays in `ai-learnings`; reusable practices enter here after comparison and adaptation. [Source intake](source-intake.md) records the decisions.

## Choose the next action

| Need | Entry point | Result |
| --- | --- | --- |
| Understand an unfamiliar repository | `/repo-discovery` | Structure, validation and risk maps |
| Clarify the user problem | `/discovery` | PRD; resolve meaningful ambiguities |
| Stress-test a plan or decision | `/grill-me` | Decision tree, assumptions and a clear next action |
| Capture settled requirements | `/to-spec` | Observable criteria, contracts, test interfaces |
| Break work into deliverable slices | `/to-tickets` | Tickets with explicit blockers |
| Investigate a bug | `/diagnose` | Reproduction and supported cause |
| Compare module interfaces | `/design-module` | Alternatives and migration trade-offs |
| Test a design uncertainty | `/prototype` | Disposable experiment and recorded verdict |
| Evaluate an issue or PR | `/triage` | Evidence and execution readiness |
| Plan and build | `/plan`, `/execute` | Approved plan, TDD implementation |
| Verify | `/review`, `/quality`, `/qa` | Separate semantic and deterministic evidence |
| Resume in a fresh session | `/compact-progress` | Concise handoff with artifact pointers |
| Resolve an active merge/rebase | `/resolve-conflicts` | Intent-preserving resolution and checks |
| Curate an instruction pack | `/review-skill` | Focused, attributed, validated instructions |

The slash names identify canonical prompt documents in `.ai/commands/`; native slash-command support varies by tool. Where the adapter does not expose a command, ask the agent to read that document and substitute its arguments. The shared skills are projected to Cursor, portable/Codex and Hermes locations; Copilot receives workflow prompts. No Matt-specific setup tool is required.

The eight added commands are canonical-file-only for GitHub Copilot in this revision: the existing generator's prompt mapping does not expose them as native Copilot prompts. For example, ask Copilot to read `.ai/commands/to-spec.md` and apply it to your supplied requirements. Existing generated Copilot prompts remain available.

## Example: a new capability

1. Clarify the problem if necessary, then run `/to-spec` against the agreed requirements.
2. For multi-session work, run `/to-tickets`; for small work, go directly to `/plan`.
3. Implement the next unblocked slice using existing authorization and repository gates.
4. Check the user outcome and standards independently. Capture actual checks and gaps before the next slice.

Use domain vocabulary only where it removes ambiguity. Create glossary/ADR files when an actual decision exists. Keep experimental prototypes separate from production work and retain Red–Green–Refactor for production behavior changes.

## Adoption limits

These instructions are not proof that a model will follow them, and Markdown permissions are not sandbox enforcement. Structural checks, adapter synchronization and example walkthroughs are different from live validation in each vendor. Source license notices travel with copied adaptations. No external service, MCP server or course dependency is enabled by this integration.
