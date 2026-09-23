# GitHub Copilot adapter

GitHub Copilot does not map one-to-one to `.ai/agents`, so the adapter generates repository instructions, path-specific instructions and reusable prompts.

## Generated structure

```text
.github/
  copilot-instructions.md
  instructions/
    architecture.instructions.md
    testing.instructions.md
    frontend.instructions.md
    quality.instructions.md
    agent-guardrails.instructions.md
  prompts/
    discovery.prompt.md
    plan.prompt.md
    execute.prompt.md
    review.prompt.md
    qa.prompt.md
    ...
```

## Usage

```bash
pnpm ai:sync
pnpm vendors:check
```

Use prompt files as explicit workflows. Examples:

```text
plan.prompt.md
execute.prompt.md
review.prompt.md
refactor.prompt.md
enforce-tdd.prompt.md
```

## Policy

- Copilot should read `AGENTS.md` first.
- Repository instructions explain how to build, test and validate.
- Path-specific instructions apply architecture, testing, frontend and quality standards.
- Prompt files mirror `.ai/commands` for manual invocation.
