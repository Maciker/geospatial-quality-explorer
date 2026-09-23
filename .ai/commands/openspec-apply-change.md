Apply an OpenSpec change.

Change: $ARGUMENTS

Workflow:
1. Select the provided change name. If none is provided, list active changes with `openspec list --json` and ask if ambiguous.
2. Inspect status with `openspec status --change "<name>" --json`.
3. Get apply instructions with `openspec instructions apply --change "<name>" --json`.
4. Read every path listed in `contextFiles`.
5. Show schema name, progress, and remaining tasks.
6. Implement tasks in order.
7. For each task:
   - use TDD for behavior changes
   - keep edits scoped
   - run focused checks
   - mark the task complete in `tasks.md` only after validation
8. Stop on real blockers.

Output:
## Implementation Status

Change: <name>
Schema: <schema>
Progress: <complete>/<total> tasks complete

Completed this session:
- [x] <task>

Remaining or blocked:
- [ ] <task or blocker>
