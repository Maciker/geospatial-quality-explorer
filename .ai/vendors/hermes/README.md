# Hermes Agent vendor adapter

Generated target: .hermes/config.yaml, .hermes/skills/, .hermes/AGENTS.md and .hermes/README.md.

Hermes Agent (Nous Research) consumes agentskills.io skills and AGENTS.md project context natively, so .ai/skills
is projected as-is. The skills work both as a publishable tap (`hermes skills tap add maciker/agent-workflow-code-ts`)
and as a local external skills directory. config.yaml is a secret-free example; API keys belong in ~/.hermes/.env.

See docs/hermes.md for setup.
