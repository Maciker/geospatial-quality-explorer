---
applyTo: "apps/**/*.ts,apps/**/*.tsx,packages/**/*.ts,packages/**/*.tsx"
---

# Architecture instructions

Follow hexagonal architecture from .ai/skills/architecture-hexagonal. Use vertical business modules, enforce Infrastructure -> Application -> Domain, and never put business logic in Infrastructure.
