# Quality ratchet

The ratchet prevents known technical debt from growing.

## Bootstrap

Initialize baselines once:

```bash
pnpm quality:init
```

This records the current deterministic findings under:

```text
quality/baselines/
```

## Normal execution

```bash
pnpm quality:ratchet
```

The rule is:

```text
current findings - baseline findings = new findings -> fail
baseline findings - current findings = fixed findings -> shrink baseline
```

## Scope

The ratchet covers deterministic findings:

- ESLint
- architecture rules
- duplication

QA findings are handled by `pnpm qa:gate`. They are not part of the deterministic ratchet because model output should not silently change baselines.

## Baseline policy

Baselines may shrink automatically when problems are fixed.

Baselines must never grow automatically.

If a new finding is intentionally accepted, require a human review and a dedicated commit explaining the exception.
