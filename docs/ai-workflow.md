# AI workflow

## Flow

```text
discovery -> plan -> approve -> execute -> review -> quality -> PR
```

## Artifacts

| Phase | Owner | Artifact |
| --- | --- | --- |
| Discovery | Human + debater | `.ai/workspace/prds/*.md` |
| Plan | planner | `.ai/workspace/plans/*.md` |
| Approval | Human | approved checklist |
| Execute | executor | code + commits + summary |
| Review | reviewer / QA agents | `.ai/workspace/reviews/*.md` |
| Quality | scripts / CI | deterministic checks |

## Rule

Agents work in small slices. After each slice, keep the validated output and discard noisy context.
