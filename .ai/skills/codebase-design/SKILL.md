---
name: codebase-design
description: Use when designing a module interface, comparing alternative designs, or identifying excessive coupling and shallow abstractions.
---

# Codebase Design

Judge a module by how much useful behavior callers obtain for the concepts they must learn. Its interface includes types, invariants, ordering, errors, configuration and performance expectations.

- Trace a real caller before proposing an abstraction. Identify repeated coordination, leaked implementation details and knowledge duplicated across callers.
- Prefer a small interface that owns a coherent responsibility. More implementation lines do not make a module better.
- Ask what happens if the module disappears: does complexity disappear too, or spread to its callers? A pass-through may still earn its place as a required architectural port.
- Keep the existing hexagonal dependency rules. Domain and application contracts remain valid even with one production adapter; an in-memory implementation can supply the test alternative.
- Test observable behavior at a stable interface. Keep internal seams private unless callers actually need them. Use the repository's in-memory repository and application-port test policies.

For a consequential interface decision, compare at least two materially different designs against concrete use cases: caller simplicity, hidden complexity, testability, dependency direction and migration cost. Use sequential sketches unless parallel design work is available and authorized. Record the chosen trade-off in the plan; use an ADR only for a durable, costly decision.

When surveying architecture, report candidates and evidence without editing production code. Each candidate needs the current friction, proposed interface, affected callers, tests preserving behavior, and a reversible migration. Retire old tests only after their requirements remain covered; never remove a failing test to make the refactor pass.

Adapted from Matt Pocock's `codebase-design` and `improve-codebase-architecture`; see repository-root `THIRD_PARTY_NOTICES.md`.
