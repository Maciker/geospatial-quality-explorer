# Trust Model

The workflow does not ask people to trust an AI agent. It creates independent layers that make agent output checkable.

## Trust layers

| Layer | Purpose | Evidence |
| --- | --- | --- |
| Scope | Make the work explicit before implementation | PRD, plan, task workspace |
| Deterministic checks | Catch syntax, type, test, architecture and duplication issues | command output, quality reports |
| Ratchet | Prevent new known debt | baseline diff |
| Read-only review | Find semantic, design and testing issues | review report |
| Cross-model QA | Reduce implementer bias | QA JSON report |
| Human approval | Accept product intent and risk | PR review or explicit approval |

## What agents may decide

Agents may:

- propose questions;
- draft PRDs and plans;
- implement approved changes;
- produce review findings;
- collect validation evidence.

Agents may not:

- approve their own work as final;
- grow quality baselines automatically;
- hide or delete findings;
- accept product risk;
- merge without human approval.

## Review ownership

- Deterministic tooling owns repeatable mechanical checks.
- Review agents own structured findings.
- Cross-model QA owns adversarial semantic review.
- Humans own intent, priorities, risk and final approval.
