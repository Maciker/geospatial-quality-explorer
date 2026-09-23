# OpenSpec Profile

Optional profile for repositories that track product and technical changes through OpenSpec.

## Adds

- `/openspec-explore`
- `/openspec-propose`
- `/openspec-apply-change`
- `/openspec-archive-change`

## Policy

OpenSpec is not required for the core boilerplate. Activate this profile only when the team wants proposals, designs, specs, and implementation tasks to be tracked as durable artifacts.

## Command Compatibility

- Unix/macOS/Linux: prefer `openspec`.
- Windows PowerShell: prefer `openspec.cmd`.

## Guardrails

- Exploration does not implement code.
- Propose creates artifacts, not application changes.
- Apply implements tasks in order and uses TDD for behavior changes.
- Archive never silently archives incomplete work.
