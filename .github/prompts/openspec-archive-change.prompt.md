---
description: "Openspec Archive Change workflow from agent-guardrails-ts"
---

# Openspec Archive Change

Read AGENTS.md first. Then follow this workflow.

Archive a completed OpenSpec change.

Change: $ARGUMENTS

Workflow:
1. Select the provided change. If none is provided, list active changes and ask when ambiguous.
2. Check artifact completion with `openspec status --change "<name>" --json`.
3. Check `tasks.md` for incomplete `- [ ]` items.
4. Warn before archiving if artifacts or tasks are incomplete.
5. If delta specs exist, summarize what will be synced.
6. Archive with `openspec archive "<name>"`. On Windows PowerShell, use `openspec.cmd`.
7. If manual archive is required, preserve every artifact and do not overwrite existing archives.

Output:
- change name
- schema
- archive location
- whether specs were synced
- incomplete artifact or task warnings
