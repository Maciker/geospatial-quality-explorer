# Stabilization profile

Use this profile before publishing a release archive or adopting the boilerplate in a new repository.

## Purpose

Validate that the repository works as an installable product, not only as a collection of files.

## Commands

```bash
pnpm ai:sync
pnpm vendors:check
pnpm codex:check
pnpm codex:skills:budget
pnpm dogfood:check
pnpm quality:fast
```

Run `pnpm quality:full` in a local environment with all dependencies installed before tagging a release.

## Pass criteria

- vendor adapters are synchronized
- Codex custom agents and hooks are valid
- skill budget stays under the configured threshold
- dogfood tasks and docs are present
- Git hooks can be installed
- fast quality gates pass
