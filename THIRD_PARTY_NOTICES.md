# Third-party sources and attribution

## Natural Earth — Admin 0 Countries 1:110m

Source: https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/

Frozen download: `packages/quality/fixtures/provenance/natural-earth-110m-admin0/ne_110m_admin_0_countries.zip` (version 5.1.1). Derived catalog samples: `ne-admin0-westeurope*.geojson`.

Natural Earth data is public domain under the [Natural Earth terms of use](https://www.naturalearthdata.com/about/terms-of-use/). This repository does **not** relabel those samples as CC0-1.0; runs use license `NaturalEarth-public-domain`. The `*-demo-errors` derivative injects intentional defects for the demo and must not be attributed to Natural Earth. See `packages/quality/fixtures/LICENSE.md` and `packages/quality/fixtures/provenance/natural-earth-110m-admin0/PROVENANCE.md`.

## Matt Pocock — Skills For Real Engineers

Source: https://github.com/mattpocock/skills

Reviewed revision: `c55ee46073ed923f86ce59a5eb3b6d895095d1b7` (2026-09-18).

Additional reviewed revision: `49dd158d1076134a641b33efb035946536778336` (2026-10-11 intake). The optional `retro` skill and `/retro` command are original local adaptations. Targeted updates cover test-boundary coverage, mutation evidence, standards discovery, tracker relationships, issue intake and interview recommendations. PR-description guidance summarizes principles without copying the upstream template or examples. Upstream `pr` credits Dex Horthy / Humanlayer's `show-me`: https://github.com/humanlayer/skills/blob/main/plugins/show-me/skills/show-me/SKILL.md.

Copyright (c) 2026 Matt Pocock. Licensed under MIT; the complete notice is in [licenses/mattpocock-skills-MIT.txt](licenses/mattpocock-skills-MIT.txt).

Adaptations cover the six added knowledge skills (`codebase-design`, `domain-modeling`, `diagnosing-bugs`, `writing-for-agents`, `grilling`, `grill-me`), the spec/ticket/design/diagnosis/prototype/triage/conflict commands and associated templates, behavior-oriented testing, migration guidance, separate review axes, primary-source research, and compact handoffs. Generated vendor projections carry these same adaptations and remain covered by this notice.

These are curated adaptations maintained here, not an upstream mirror, endorsement, or unmodified Matt Pocock distribution. Local workflow, test and authorization rules take precedence. See [the intake matrix](docs/source-intake.md) for per-source decisions.

## Emil Kowalski — Skills for Designers and Engineers

Source: https://github.com/emilkowalski/skills

Reviewed revision: `d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128` (2026-09-23).

Additional reviewed revision: `2d228630ba1446365f614a108cb8252f1feda202` (2026-10-11 intake). Two further optional skills, `break-ui` and `animation-performance`, bring the pack to fifteen. `break-ui/CATALOG.md` is retained. Skill bodies have concise triggers, no canned introductory pause or invented firsthand persona, explicit executor/reviewer boundaries and canonical workflow handoffs. Animation guidance qualifies acceleration/driver claims and retains layout/accessibility semantics and measurement limitations. The existing thirteen bodies remain unchanged. Projections are covered by the preserved Emil MIT notice.

Copyright (c) 2026 Emil Kowalski. Licensed under MIT; the complete notice is in [licenses/emilkowalski-skills-MIT.txt](licenses/emilkowalski-skills-MIT.txt).

Thirteen skills and their companion Markdown resources are included under `.ai/skills/`, with the same content projected into Cursor, portable/Codex, and Hermes skill directories. The imported skill bodies and supporting files are retained with narrow local adaptations: frontmatter descriptions are shortened for clear triggers and Codex's skill-index budget; `animate-expo` uses the declared package manager; animation-plan paths and execution are aligned with the repository workflow; and the selected prototype is handed off through the approved plan process. Upstream `prototype` is named `ui-prototype` locally to avoid collision with the existing workflow command. Per-file details are in [source intake](docs/source-intake.md).

This is a maintained integration of the reviewed revision, not an automatic upstream mirror or endorsement. Repository-specific approval, implementation, testing, and review requirements take precedence. See [the intake matrix](docs/source-intake.md) for per-skill decisions.

## Iker Macaya — ai-learnings training collection

Source: https://github.com/Maciker/ai-learnings

Reviewed revision: `c614b59c2da8bc87fe072f671c85317647ba6016` (2026-09-18).

The collection contains LeanMind exercises/notes and Software Crafters masterclasses. The source is credited for the training concepts and architecture examples identified in the intake matrix. This change adds original summaries and links; it does not redistribute course applications, slides, exercises, datasets, provider configurations or course scripts verbatim.

The collection has no root license in the reviewed tree. Some individual READMEs mention MIT, which is not treated as permission for every course file. Verify provenance and redistribution rights separately before copying additional training assets or publishing previously private material. This notice does not grant a license to the overall repository or retrospectively license pre-existing files.
