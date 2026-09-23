---
name: writing-for-agents
description: Use when authoring or reviewing agent instructions, skill descriptions, context pointers, or reusable workflow documents.
---

# Writing for Agents

Place reusable knowledge in skills, user-started procedures in commands, isolated roles in agents, and framework-specific conventions in optional profiles. Edit `.ai/` and regenerate projections; avoid vendor-specific tool names in canonical instructions.

Every pointer needs a real destination and a condition explaining when to read it. Keep shared constraints in the entrypoint; move substantial guidance needed by only one branch into a linked reference. Avoid repeating the same policy in several sources.

Use short, discriminating skill descriptions. Write observable completion criteria: the artifact or evidence that distinguishes finished from unfinished. Separate facts, assumptions and instructions, and preserve the user's scope and authorization.

Prefer environment facts from scripts/configuration over cached prose. Include the convention or reason that cannot be discovered there. Remove generic advice, redundant synonyms and scaffolding without an actual use.

Validate frontmatter and local references, regenerate adapters, check the skill-index budget, and try a representative request plus a nearby request that should not trigger the skill. Report structural validation separately from behavioral evaluation.

Adapted from Matt Pocock's `writing-for-agents`. The knowledge/command/role distinction also reflects the training material indexed in `docs/source-intake.md`. See repository-root `THIRD_PARTY_NOTICES.md`.
