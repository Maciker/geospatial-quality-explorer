# Hermes Agent adapter

This directory is generated from .ai/ by `pnpm ai:sync`. Do not edit generated files here.
Edit the canonical source in .ai/ (or AGENTS.md) and regenerate.

## Contents

- `config.yaml`: secret-free example Hermes config (model provider, external skills dir, terminal backend).
- `skills/`: agentskills.io skills projected from .ai/skills. Compatible with Hermes taps and external skill dirs.
- `AGENTS.md`: copy of the root project instruction contract. Hermes auto-discovers it as project context.

## Use the skills

Two supported paths:

1. **Tap (publishable):** other Hermes users add this repository as a tap:

   ```bash
   hermes skills tap add maciker/agent-workflow-code-ts
   ```

2. **Local external directory:** point Hermes at the projected skills via config.yaml
   (`skills.config.agent_workflow.path: ./.hermes/skills`) or copy them into `~/.hermes/skills/`.

Skills appear in the system-prompt index, `skills_list`, `skill_view`, and as `/<skill-name>` slash commands.

## Configure the model

Set the provider and model in config.yaml or with `hermes model <provider:model>`. Put the matching API key in
`~/.hermes/.env` (for example `NOUS_API_KEY=...`). Never place secrets in config.yaml or in this directory.

See ../docs/hermes.md for the full setup guide.
