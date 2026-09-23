---
name: domain-modeling
description: Use when resolving ambiguous domain terms, defining business relationships, or updating a domain glossary and architectural decisions.
---

# Domain Modeling

Read the existing glossary and relevant ADRs before changing vocabulary. If the project has a context map, load only the affected context. Use the project's existing documentation locations.

1. Identify terms that have multiple meanings, conflicting definitions, or unclear ownership.
2. Check concrete scenarios against both the user's intended behavior and the current implementation. Label disagreements as intended vs implemented; neither silently rewrites the other.
3. Resolve only questions that affect behavior or design. Reuse answers already provided; record unresolved terms as open questions.
4. Record agreed terms, relationships, invariants and rejected synonyms in the glossary. Create `CONTEXT.md` only when there is a resolved concept to record. Keep implementation plans elsewhere.
5. Create an ADR when a real trade-off is costly to reverse and would otherwise surprise a future maintainer. Record context, decision, alternatives and consequences; ordinary naming decisions need no ADR.

Use the repository-root `.ai/templates/domain/` templates only when no project format exists. Changing documentation does not authorize code renames, migrations or behavior changes.

Adapted from Matt Pocock's `domain-modeling` and `grill-with-docs`; see repository-root `THIRD_PARTY_NOTICES.md`.
