# Review Layers

Use different review layers for different risks.

## Layers

1. **Local validation**: typecheck, lint, tests and focused commands.
2. **Architecture validation**: dependency direction and module boundaries.
3. **Ratchet validation**: no new known debt.
4. **Read-only reviewer**: semantic review against plan and standards.
5. **Cross-model QA**: independent review from a different model.
6. **Human review**: intent, tradeoffs, product risk and final approval.

## Rule

A finding is useful only when it includes:

- file or area;
- severity;
- explanation;
- why it matters;
- suggested fix or next action.
