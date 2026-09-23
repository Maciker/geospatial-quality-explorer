Explore with OpenSpec awareness.

Topic or change: $ARGUMENTS

Use this command for discovery, investigation, design comparison, and requirements clarification. Do not implement application code.

Workflow:
1. If OpenSpec is installed, list active changes with `openspec list --json`. On Windows PowerShell, use `openspec.cmd list --json`.
2. If a change is selected, read relevant artifacts under `openspec/changes/<name>/`.
3. Explore the problem space, inspect code where useful, compare approaches, and surface risks.
4. Map stable insights to possible OpenSpec artifacts:
   - new or changed requirement -> `specs/<capability>/spec.md`
   - design decision -> `design.md`
   - scope or non-goal change -> `proposal.md`
   - implementation work -> `tasks.md`
5. Do not update artifacts unless the user explicitly asks.

Output:
- problem summary
- likely approach
- tradeoffs
- open questions
- suggested next step
