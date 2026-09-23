Operate the quality ratchet.

Task: $ARGUMENTS

Bootstrap once:

```bash
pnpm quality:init
```

Normal execution:

```bash
pnpm quality:ratchet
```

Policy:
- New deterministic findings fail the gate.
- Fixed findings shrink the baseline automatically.
- Baselines must never grow automatically.
- QA findings are handled by the QA gate, not by deterministic ratchet baselines.
