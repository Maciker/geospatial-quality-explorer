# Progress Compaction

Use progress compaction when a task gets long, logs get noisy, or a new session should continue safely.

## Command

```text
/compact-progress <task-id>
```

## Output

```text
.ai/workspace/tasks/<task-id>/progress.md
```

## What to keep

- goal;
- approach;
- completed steps;
- current blocker;
- relevant files;
- decisions;
- risks;
- next step;
- minimal context to carry forward.

## What to remove

- repeated discussion;
- long raw logs;
- obsolete alternatives;
- low-value chatter.
