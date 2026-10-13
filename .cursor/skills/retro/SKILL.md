---
name: retro
description: Use when the user requests a retrospective on a coding session or repeated agent failure, to identify evidence-backed improvements to checks, navigation, instructions and tooling.
---

# Agent Environment Retrospective

Improve future runs from observed session failures, not speculative rules. This is an optional, user-invoked discipline; it does not automatically expand feature scope or change the agent environment.

Read the repository's `writing-for-agents` guidance before suggesting instruction changes. Use the actual session artifacts, commands, logs, diff and review findings as primary sources. If those are unavailable, state the gap; do not invent a session history.

## Classify the failure

| Category | Evidence to look for | Candidate response |
| --- | --- | --- |
| Navigation | Repeated searches, missed dependencies or unclear ownership | A short pointer to existing documentation |
| Automated checks | A reproducible error missed by lint, typing, tests or CI | Repair or wire an existing check before creating another |
| Mechanical standards | A fixed syntax, import, banned API or location pattern | The cheapest deterministic rule supported by existing tooling |
| Judgment standards | Cross-file consistency or a tradeoff requiring context | A concise review criterion with an example |
| Instruction pressure | Duplicated, conflicting or unused instructions | Clarify ownership, shorten or remove the demonstrated no-op |
| Tool economy | Repeated calls or unnecessarily large outputs | Narrow queries, compact artifacts or existing scripts |
| Information access | Diagnosis blocked by missing logs or documentation | A bounded source or redacted evidence request |

Search existing scripts, hooks, CI, skills and standards first. A rule that exists but is not executed is a wiring failure, not a reason to duplicate it.

Mechanical checks should enforce the active project/profile, not universalize optional conventions such as the strict React profile. Scope banned-API checks to the packages where that policy applies.

Implementation agents still need the applicable correctness and architecture rules. Review criteria supplement that context; they do not excuse implementation from following the repository contract.

## Evidence and recommendation

For each candidate record the observed failure, source artifact, current mechanism, smallest proposed change, expected benefit, verification method and limitation. Rank by recurrence and impact. Prefer a few demonstrated changes over adding rules for every imaginable error.

The retrospective reviewer is read-only. Recommendations do not authorize editing global `AGENTS.md`, installing tools, changing access, publishing tickets, scheduling tasks, merging or deploying. Accepted changes return to the planner/executor and normal checks. Honor authorization already given for the specific scope.

Use repository-root `.ai/commands/retro.md` for the session workflow. Save evidence under the existing task workspace; avoid provider-specific session paths or OS-temp-only handoffs.

Adapted from Matt Pocock's `retro` at `49dd158d1076134a641b33efb035946536778336`; see repository-root `THIRD_PARTY_NOTICES.md`.
