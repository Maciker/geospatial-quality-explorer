---
description: "Openspec Propose workflow from agent-guardrails-ts"
---

# Openspec Propose

Read AGENTS.md first. Then follow this workflow.

Propose a new OpenSpec change.

Request: $ARGUMENTS

Workflow:
1. Derive or use the provided kebab-case change name.
2. If the request is too vague to identify the change, ask one concise clarifying question.
3. Create the change with `openspec new change "<name>"`. On Windows PowerShell, use `openspec.cmd`.
4. Inspect status with `openspec status --change "<name>" --json`.
5. For each ready artifact, get instructions with `openspec instructions <artifact-id> --change "<name>" --json`.
6. Read dependency artifacts listed in the instructions.
7. Create proposal, design, specs, and tasks required by the active schema.
8. End with `openspec status --change "<name>"`.

Rules:
- Do not implement application code.
- Keep artifacts concise and implementation-ready.
- Tasks must be ordered inside-out and include validation.

Output:
- change name
- location
- artifacts created
- readiness for apply
