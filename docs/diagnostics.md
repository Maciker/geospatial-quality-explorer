# Diagnostics

Temporary diagnostic script for checking the guardrails package in a local environment.

Run from the repository root:

```bash
bash scripts/diagnostics/run-guardrails-check.sh
```

The diagnostics script writes logs and may install dependencies, regenerate adapters and install Git hooks. For a read-only environment check use `pnpm doctor`.

To disable installation, full checks and hook setup:

```bash
RUN_INSTALL=0 RUN_FULL=0 RUN_HOOKS=0 bash scripts/diagnostics/run-guardrails-check.sh
```

The log is written to:

```text
_diagnostics/guardrails-check-YYYYMMDD-HHMMSS.log
```

Useful environment flags:

```bash
RUN_INSTALL=0 RUN_FULL=0 bash scripts/diagnostics/run-guardrails-check.sh
RUN_QA_STRICT=1 bash scripts/diagnostics/run-guardrails-check.sh
```
