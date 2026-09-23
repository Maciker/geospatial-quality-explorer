# Windows troubleshooting

This repo is tested as a cross-platform Node/pnpm workspace. The guardrails avoid shell-only commands in generated scripts.

## Recommended shell

Use one of these:

- PowerShell 7+
- Windows Terminal with PowerShell
- Git Bash if your team standardizes on Bash

Do not rely on Unix-only shell snippets in package scripts. Use Node helper scripts instead.

## Common issues

### `mkdir -p` creates a `-p` directory

This happens when a Unix command is executed by `cmd.exe`.

The package scripts use Node helpers such as:

```bash
node tools/quality/collect-eslint-json.mjs
node tools/quality/collect-depcruise-json.mjs
```

### Vendor checks show absolute paths inside generated paths

Run:

```bash
pnpm ai:sync
pnpm vendors:check
pnpm codex:check
```

v0.7.2 normalizes paths with `path.basename()` and `path.relative()` to avoid Windows absolute-path leakage.

### Hooks fail with `fatal: not in a git directory`

Initialize Git first:

```bash
git init
pnpm setup:hooks
```

### ESLint reports `file was not found by the project service`

Typed linting only applies to TypeScript source and tests. Node tooling `.mjs` files are linted without TypeScript project service.

### Doctor command

Run:

```bash
pnpm doctor
```

It checks Node, pnpm, required files and whether Git is initialized.
