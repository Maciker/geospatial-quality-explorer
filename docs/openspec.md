# OpenSpec Profile

OpenSpec support is optional. Use it when the team wants tracked change artifacts: proposal, design, specs, and tasks.

## Commands

```text
/openspec-explore <topic-or-change>
/openspec-propose <feature-or-fix>
/openspec-apply-change <change-name>
/openspec-archive-change <change-name>
```

## Flow

```text
explore -> propose -> apply -> archive
```

## Platform Notes

- Unix/macOS/Linux: use `openspec`.
- Windows PowerShell: use `openspec.cmd`.

## Guardrails

- Explore does not modify application code.
- Propose creates OpenSpec artifacts only.
- Apply implements tasks in order using TDD for behavior changes.
- Archive checks incomplete artifacts and tasks before finalizing.

Activate the profile by adopting `quality/profiles/openspec.md` in your project docs.
