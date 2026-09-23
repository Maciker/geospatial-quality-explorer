# Agents

Agents are specialized roles. Each agent has a narrow responsibility, a permission profile, and a structured output.

## Core agents

- `repository-analyst`: maps an unfamiliar repository before task work begins. Read-only.
- `debater`: clarifies the problem and writes PRDs.
- `planner`: creates implementation plans. Read-only for production code.
- `executor`: implements approved plans with TDD.
- `reviewer`: validates implementation against the plan and rules.
- `validator`: runs project validation through package scripts.

## Specialist agents

- `qa-cross-model`: independent diff review with score.
- `security-reviewer`: security-focused review.
- `architecture-reviewer`: boundary and dependency-direction review.
- `test-reviewer`: test quality and coverage review.
- `code-reviewer`: TypeScript implementation quality review.
- `maintainer-filter`: removes noisy automated findings.

## Optional profile agents

- `frontend-reviewer`: React component, hook, CSS Module, context, and store review.
- `functional-qa`: browser-based acceptance QA and E2E coverage audit.
- `ux-reviewer`: visual UX, responsive, accessibility, and interaction review.

## Read-only review policy

Reviewers do not edit files. Findings flow back into the standard workflow:

```text
finding -> plan -> approval -> executor -> review -> quality gate
```

## Permission profiles

See `quality/permission-profiles.md` and `docs/review-agents.md`.

## v0.5 additions

- `architecture-reviewer` now relies on `architecture-hexagonal`.
- `code-reviewer` now relies on `design-principles`.


## v0.7.5 additions

- `repository-analyst` produces repo maps, validation maps, architecture maps, risk maps and suggested `AGENTS.md` updates.
