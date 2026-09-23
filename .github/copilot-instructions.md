# Copilot instructions

Read and follow the nearest AGENTS.md file first. The canonical source for workflow, agents, commands and skills is .ai/.

## Repository workflow

1. Discovery before solution design when the request is ambiguous.
2. Plan before implementation.
3. Human approval before executor changes production code.
4. TDD for behavior changes.
5. Review after implementation.
6. Run quality gates before finishing.

## Build and validation

- Install with pnpm install.
- Fast local validation: pnpm quality:fast.
- Full validation: pnpm quality:full.
- QA gate: pnpm qa:gate after a cross-model QA JSON exists.
- Do not grow quality baselines automatically.

## Architecture and code rules

- Use hexagonal architecture for production TypeScript.
- Follow .ai/skills/design-principles for naming, functions, classes and errors.
- Follow .ai/skills/testing-standards for tests.
- Follow .ai/skills/xp-tdd-practices for implementation.

## Vendor adapter policy

Files under .github/instructions and .github/prompts are generated from .ai/ by pnpm sync:ai. Edit .ai/ first.
