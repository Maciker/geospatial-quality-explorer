---
name: qa-review
description: Use when reviewing an implemented diff against a PRD or plan.
---

# QA Review

Review behavior, not style preferences.

## Finding quality bar

A finding is valid only if it includes:

- File and line.
- Observable problem.
- Why it matters.
- Suggested fix.
- Severity.
- Confidence.

## Severity

- P0: data loss, security issue, build broken.
- P1: acceptance criterion not met, regression likely.
- P2: important but non-blocking improvement.
