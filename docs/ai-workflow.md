# AI workflow

## Flow

```text
discovery -> plan -> approve -> execute -> review -> quality -> PR -> post-PR review
```

## Artifacts

| Phase | Owner | Artifact |
| --- | --- | --- |
| Discovery | Human + debater | `.ai/workspace/tasks/<task-id>/discovery.md` |
| Plan | planner | `.ai/workspace/tasks/<task-id>/plan.md` |
| Approval | Human | `Approval` section of the plan (`Status: approved`, approver, date) |
| Execute | executor | code + commits + `.ai/workspace/tasks/<task-id>/summary.md` |
| Review | reviewer / QA agents | `.ai/workspace/tasks/<task-id>/review.md` + `.ai/workspace/qa/` |
| Quality | scripts / CI | deterministic checks |
| PR | the tool or person opening the PR | pull request URL + exact base/head SHA |
| Post-PR review | independent read-only reviewer | `.ai/workspace/pr-reviews/post-pr-review.json` + durable PR evidence |

## Rule

Agents work in small slices. After each slice, keep the validated output and discard noisy context.
