# Pull request descriptions

Lead with the concrete problem and resulting behavior. A reader should understand the final change without knowing the conversation that produced it.

- Describe the trigger and before/after behavior when useful. Use a small diff or diagram only when it clarifies the change.
- Include relevant execution evidence: checks and results, a regression test, or screenshots for visual changes. Distinguish verified results from checks not run.
- State rollback difficulty and the affected consumers, data or interfaces when material. A destructive migration needs more detail than a reversible copy edit.
- Keep the existing repository template. Simple changes need only a short explanation and validation; do not force every PR into a diagram or risk checklist.
- Include the workflow's required exact-SHA QA evidence and limitations. These writing rules do not replace pre-PR or post-PR gates and do not authorize merge.

This original guidance adapts principles reviewed in Matt Pocock's `pr` at `49dd158d1076134a641b33efb035946536778336`, which credits Dex Horthy / Humanlayer's `show-me`. No upstream PR template or examples are vendored. See `THIRD_PARTY_NOTICES.md`.
