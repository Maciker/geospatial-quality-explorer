# Review Skill

Input: $ARGUMENTS (existing skill or proposed recurring task).

Use `writing-for-agents` and `docs/skill-intake-policy.md`. Find overlap before adding a skill. Decide whether the content is knowledge, a command, an agent role, a profile or a one-off artifact.

Record the trigger, excluded neighboring cases, source/license, required capabilities, dependencies, completion evidence and a representative exercise. Keep instructions provider-neutral and supporting resources reachable. For an existing skill, preserve its useful behavior and narrow the patch to demonstrated problems.

After authorized edits, run `pnpm ai:sync`, `pnpm vendors:check` and `pnpm codex:skills:budget`. Structural checks do not replace trying the representative task. Record validation and source attribution alongside the change.
