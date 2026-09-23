# Trust Model Policy

Agent output is never trusted by default. Trust is built through layers.

## Trust layers

1. Clear scope and artifact handoff.
2. Deterministic checks such as typecheck, lint, tests, architecture checks and ratchet.
3. Semantic review by read-only reviewers.
4. Cross-model QA for agent-generated changes.
5. Human approval for scope, risk and final merge decisions.

## Non-negotiable rules

- The same agent that implemented a change must not be the only reviewer.
- Review agents are read-only.
- Quality baselines may shrink automatically but must not grow automatically.
- Generated review reports must not be edited to hide findings.
- Human review owns product intent, risk acceptance and merge approval.
