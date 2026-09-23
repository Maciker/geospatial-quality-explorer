---
name: diagnosing-bugs
description: Use when diagnosing a reproducible bug, intermittent failure, or performance regression before proposing a fix.
---

# Diagnosing Bugs

Build a feedback loop that distinguishes the reported failure from unrelated errors. Start with a focused test; otherwise use a local request, CLI fixture, browser scenario or isolated replay. Read code as needed to build the reproduction.

Record the exact command, environment, expected result and actual symptom. A missing dependency or failing setup is not reproduction of the bug. For intermittent behavior, record attempts and failure rate, control timing or random seeds where possible, and avoid calling a few clean runs proof of a fix.

Reduce inputs and steps one at a time while preserving the symptom. Rank plausible causes with a prediction that could disprove each; test one variable at a time. For slowness, establish a representative baseline and measure after each change. Use targeted, removable instrumentation and redact secrets from captured artifacts.

When a reliable reproduction is unavailable, report attempted routes and the missing evidence. Request only the access or redacted artifact needed; do not claim a speculative patch fixes the bug. Production instrumentation and external writes require their own authorization.

Pass the reproduction and supported cause into the normal plan/executor workflow. Before an authorized fix, turn the reproduction into a failing regression test at an interface that can expose the real failure. Apply the smallest fix, run the regression and original scenario, then remove temporary instrumentation. If that interface cannot be tested, document the gap instead of adding a test that cannot catch the bug.

Output: reproduction, evidence, eliminated hypotheses, supported cause, regression coverage, remaining uncertainty. Use repository-root `.ai/templates/tasks/diagnosis.md`.

Adapted from Matt Pocock's `diagnosing-bugs`; see repository-root `THIRD_PARTY_NOTICES.md`.
