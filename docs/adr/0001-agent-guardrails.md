# ADR 0001: Agent guardrails workflow

## Status

Accepted

## Decision

We will use a discovery-plan-execute-review workflow for AI-assisted development.

## Consequences

- Agents receive smaller tasks.
- Human approval remains at the planning and final validation points.
- Quality gates are deterministic and mandatory.
- Agent-specific instructions are stored in the repository, not in chat history.
