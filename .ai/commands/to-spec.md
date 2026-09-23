# To Spec

Input: $ARGUMENTS (conversation, PRD, issue or document).

Read the supplied source and relevant project contracts. Synthesize decisions already made; use discovery only for material gaps. Keep missing decisions visible rather than inventing requirements.

Write `.ai/workspace/tasks/<task-id>/spec.md` using `.ai/templates/tasks/spec.md`. Include the user problem, observable behavior, acceptance criteria, affected module contracts, existing test interfaces, exclusions and unresolved questions. Use `domain-modeling` when terminology needs resolution.

Prefer existing test interfaces that expose the complete behavior. Preserve precise contract snippets where they encode a decision better than prose; leave volatile implementation steps to the plan. An unresolved acceptance criterion means the spec is not ready for execution.

Default to a local artifact. Publish to a tracker only when requested or already authorized, using its existing configuration and labels. Do not require a particular tracker, setup skill, or new label scheme. This command does not implement the spec.
