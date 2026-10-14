# Source intake — 2026-09-18

## Scope and revisions

- Destination baseline: `Maciker/agent-workflow-code-ts@ee7e1ccb91760e91f1ba48cca5d93ab6a7b55570`.
- Training collection: `Maciker/ai-learnings@c614b59c2da8bc87fe072f671c85317647ba6016`.
- Matt Pocock: `mattpocock/skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7`.
- Emil Kowalski: `emilkowalski/skills@d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128` (reviewed 2026-09-23).

The recursive default-branch trees were inventoried; relevant instructions, skills, rule sets and READMEs were compared with the existing core. This is a workflow-content intake, not a runtime/security audit of every course application or a survey of unmerged branches. Immutable links below make the reviewed revision reproducible. Re-evaluate later upstream changes rather than automatically mirroring them.

## Matt Pocock intake

| Source skill | Decision | Local destination or reason |
| --- | --- | --- |
| [ask-matt](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/ask-matt/SKILL.md) | Replaced by local guide | `docs/curated-workflows.md` routes the repository's own commands. |
| [code-review](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/code-review/SKILL.md) | Merged into existing | `.ai/agents/reviewer.md`, review template; separate spec and standards axes. |
| [codebase-design](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/codebase-design/SKILL.md) | Adapted | `.ai/skills/codebase-design/`, `/design-module`; preserve hexagonal ports and existing tests. |
| [diagnosing-bugs](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/diagnosing-bugs/SKILL.md) | Adapted | `.ai/skills/diagnosing-bugs/`, `/diagnose`; bounded investigation, original-symptom verification. |
| [domain-modeling](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/domain-modeling/SKILL.md) | Adapted | `.ai/skills/domain-modeling/`, domain templates; reuse local glossary locations. |
| [grill-with-docs](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/grill-with-docs/SKILL.md) | Merged into existing | Existing `/discovery` plus `domain-modeling`; no second interview engine. |
| [implement](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/implement/SKILL.md) | Already covered | `/execute`, executor and quality gates already provide implementation. |
| [improve-codebase-architecture](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/improve-codebase-architecture/SKILL.md) | Adapted | `codebase-design`, `/design-module` survey; no mandatory HTML report. |
| [prototype](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/prototype/SKILL.md) | Adapted | `/prototype`; isolate experiments and preserve evidence, production gates remain. |
| [research](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/research/SKILL.md) | Merged into existing | `task-researcher`; primary-source evidence with versions and explicit inferences. |
| [resolving-merge-conflicts](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/resolving-merge-conflicts/SKILL.md) | Adapted | `/resolve-conflicts`; no unconditional finish, abort prohibition, or stage-everything rule. |
| [setup-matt-pocock-skills](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/setup-matt-pocock-skills/SKILL.md) | Not imported | Upstream-specific configuration; existing repository onboarding supplies context and adapters. |
| [tdd](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/tdd/SKILL.md) | Merged into existing | `testing-standards`; observable interfaces and independent expected results. Keep local Red–Green–Refactor. |
| [to-spec](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/to-spec/SKILL.md) | Adapted | `/to-spec`, spec template; no automatic tracker publishing or forced long story lists. |
| [to-tickets](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/to-tickets/SKILL.md) | Adapted | `/to-tickets`, ticket template, `safe-refactoring`; vertical slices and expand–contract. |
| [triage](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/triage/SKILL.md) | Adapted | `/triage`; reuse labels, preserve scope, no automatic close/comment actions. |
| [wayfinder](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/wayfinder/SKILL.md) | Pattern retained | Plan template distinguishes decision/research tasks from implementation. Existing task workspaces handle long work; no separate tracker state machine. |
| [wizard](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/engineering/wizard/SKILL.md) | Deferred | Manual infrastructure wizards are a separate operational task, not required by this TypeScript core. |
| [claude-handoff](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/in-progress/claude-handoff/SKILL.md) | Not imported (in progress) | Claude background-process coupling; use portable progress artifacts. |
| [implement-spec](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/in-progress/implement-spec/SKILL.md) | Deferred (in progress) | Existing execution/task workspace already covers the main flow; do not import an additional orchestrator. |
| [loop-me](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/in-progress/loop-me/SKILL.md) | Not imported (in progress) | Personal workflow discovery is outside the coding package. |
| [pr](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/in-progress/pr/SKILL.md) | Deferred (in progress) | Has additional Humanlayer credits; no text/template copied. Existing review and evidence artifacts suffice. |
| [retro](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/in-progress/retro/SKILL.md) | Deferred (in progress) | Existing skill intake and evidence-based review cover curation; reconsider after demonstrated repeated need. |
| [setup-ts-deep-modules](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/in-progress/setup-ts-deep-modules/SKILL.md) | Deferred (in progress) | Existing dependency-cruiser enforces architecture. Root-entrypoint-only rules need a separate compatibility design. |
| [writing-beats](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/in-progress/writing-beats/SKILL.md) | Not imported (in progress) | Long-form writing is outside the coding workflow. |
| [writing-fragments](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/in-progress/writing-fragments/SKILL.md) | Not imported (in progress) | Long-form writing is outside the coding workflow. |
| [writing-shape](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/in-progress/writing-shape/SKILL.md) | Not imported (in progress) | Long-form writing is outside the coding workflow. |
| [git-guardrails-claude-code](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/misc/git-guardrails-claude-code/SKILL.md) | Not imported | Vendor-specific hooks; retain current permission profiles and generated adapters. |
| [migrate-to-shoehorn](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/misc/migrate-to-shoehorn/SKILL.md) | Not imported | One-off dependency migration; no demonstrated need in this repository. |
| [scaffold-exercises](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/misc/scaffold-exercises/SKILL.md) | Not imported | Training exercise generation belongs in ai-learnings. |
| [setup-pre-commit](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/misc/setup-pre-commit/SKILL.md) | Already covered | Existing `.githooks/` and `pnpm setup:hooks`; no duplicate installer. |
| [grill-me](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/productivity/grill-me/SKILL.md) | Adapted | `.ai/skills/grill-me/`, `/grill-me`; a user-started interview for plans, decisions and ideas. |
| [grilling](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/productivity/grilling/SKILL.md) | Adapted | `.ai/skills/grilling/`; decision-tree rounds, local fact-finding and explicit handoff. |
| [handoff](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/productivity/handoff/SKILL.md) | Merged into existing | Existing `/compact-progress` and progress template; durable task artifacts instead of OS temp-only storage. |
| [teach](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/productivity/teach/SKILL.md) | Not imported | Course tutoring belongs to the learning workspace, not the coding workflow. |
| [to-questionnaire](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/productivity/to-questionnaire/SKILL.md) | Deferred | External stakeholder questionnaires are outside the recurring coding workflow. |
| [wait-what](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/productivity/wait-what/SKILL.md) | Already covered | Existing concise-communication policy; no separate conversational command. |
| [writing-for-agents](https://github.com/mattpocock/skills/blob/c55ee46073ed923f86ce59a5eb3b6d895095d1b7/skills/productivity/writing-for-agents/SKILL.md) | Adapted | `.ai/skills/writing-for-agents/`, `/review-skill`; no vendor tool coupling. |

## Training collection intake

| Source area | Contents | Decision |
| --- | --- | --- |
| [LeanMind/Lista_conceptos.md](https://github.com/Maciker/ai-learnings/blob/c614b59c2da8bc87fe072f671c85317647ba6016/LeanMind/Lista_conceptos.md) | Training concepts | Existing context, trust, task workspace and review policies already cover most concepts. Added domain vocabulary, observable specs and migration guidance as original summaries. |
| [LeanMind/desarrollo-guiado-por-ia-ts](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/LeanMind/desarrollo-guiado-por-ia-ts) | Guided TypeScript exercise | Existing planner/executor/reviewer and vendor generation already implement the reusable pattern. Do not replace the richer generator with the course script or import the mood application. |
| [LeanMind/desarrollo-guiado-por-ia-python](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/LeanMind/desarrollo-guiado-por-ia-python) | Python exercise | Outside the TypeScript package; generic workflow is already covered. |
| [LeanMind/desarrollo-ia-ts](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/LeanMind/desarrollo-ia-ts) | Unguided TypeScript baseline | Training comparison, not a reusable workflow addition. |
| [LeanMind/desarrollo-ia-python](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/LeanMind/desarrollo-ia-python) | Unguided Python baseline | Training comparison, outside this package. |
| [masterclasses/backend-architecture-rules](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/masterclasses/backend-architecture-rules) | Backend rules | Already represented by architecture-hexagonal, design-principles, testing-standards and XP/TDD. Preserve one canonical version. |
| [masterclasses/backend-template](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/masterclasses/backend-template) | Backend application template | Keep domain rules already in the core; no application code, environment files, generated build artifacts or database dependencies imported. |
| [masterclasses/frontend-rules](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/masterclasses/frontend-rules) | Frontend rules | Already represented by the optional frontend-patterns profile. Do not make framework-specific rules universal. |
| [masterclasses/frontend-template](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/masterclasses/frontend-template) | React application template | Optional frontend guidance already present; do not import the classroom application or its tooling. |
| [masterclasses/fullstack-solo-developer](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/masterclasses/fullstack-solo-developer) | Fullstack workflow and OpenSpec | Existing review agents, optional OpenSpec commands and core skills cover these patterns; no duplicate Claude skill tree. |
| [masterclasses/masterclass-04-skills](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/masterclasses/masterclass-04-skills) | Skill authoring and review | Original `/review-skill` procedure; reuse the local knowledge/command/agent distinction rather than Claude-specific scaffolding. |
| [masterclasses/masterclass-08-n8n](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/masterclasses/masterclass-08-n8n) | n8n operations | Deployment, workflow backups and webhook tests belong in an automation package. Exported workflow JSON can contain inline secrets/data; no blanket safe-to-publish claim adopted. |
| [masterclasses/masterclass-09-mcp](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/masterclasses/masterclass-09-mcp) | Small MCP server | New optional MCP architecture reference captures protocol-boundary lessons without importing SDK/version claims or the lsof application. |
| [masterclasses/masterclass-09-mcp-hexagonal](https://github.com/Maciker/ai-learnings/tree/c614b59c2da8bc87fe072f671c85317647ba6016/masterclasses/masterclass-09-mcp-hexagonal) | HTTP and MCP adapters | New architecture reference covers shared use cases, task-oriented tool catalogs and protocol-level verification; no runtime dependency added. |

## Deliberate reconciliations

- Keep the local Red–Green–Refactor cycle. Upstream now places refactoring at review time; importing both rules would create a contradiction.
- Hexagonal ports remain valid even when only one production adapter exists. Deep-module advice does not remove architectural contracts or automatically delete tests.
- Preserve the repository's knowledge/command/agent split. Provider-specific invocation fields, hard dependencies on upstream setup, shell wizards and mandatory parallel agents do not enter the canonical core.
- Use existing user authorization. Writing a local spec is not permission to post issues, contact reporters, close tickets, deploy, or merge.
- Preserve existing templates, framework profiles and adapters. No new package dependencies, workflow engines, source application code or provider accounts are introduced.
- Course materials are summarized in original language, not vendored. See [attribution and licensing boundaries](../THIRD_PARTY_NOTICES.md).

## Emil Kowalski — design and frontend skills (2026-10-01)

Source: [`emilkowalski/skills`](https://github.com/emilkowalski/skills), reviewed at commit `d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128` (2026-09-23).

| Upstream skill | Local skill | Decision and trigger |
| --- | --- | --- |
| [`animate-expo`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/animate-expo/SKILL.md) | `animate-expo` | Imported; Expo/React Native motion. |
| [`animate`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/animate/SKILL.md) | `animate` | Imported; Web motion implementation. |
| [`animation-vocabulary`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/animation-vocabulary/SKILL.md) | `animation-vocabulary` | Imported; Naming an animation effect. |
| [`apple-design`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/apple-design/SKILL.md) | `apple-design` | Imported; Apple-inspired web interaction and visual principles. |
| [`ask-sonner`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/ask-sonner/SKILL.md) | `ask-sonner` | Imported; React Sonner toast implementation and troubleshooting. |
| [`emil-design-eng`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/emil-design-eng/SKILL.md) | `emil-design-eng` | Imported; General UI craft and interaction polish. |
| [`find-animation-opportunities`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/find-animation-opportunities/SKILL.md) | `find-animation-opportunities` | Imported; Read-only motion opportunity discovery. |
| [`improve-animations`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/improve-animations/SKILL.md) | `improve-animations` | Imported; Read-only motion audit and implementation planning. |
| [`mobile-native`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/mobile-native/SKILL.md) | `mobile-native` | Imported; Mobile web and PWA behavior. |
| [`pick-ui-library`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/pick-ui-library/SKILL.md) | `pick-ui-library` | Imported; Explicitly invoked UI library selection. |
| [`prototype`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/prototype/SKILL.md) | `ui-prototype` | Imported; Explicitly invoked UI variant comparison; renamed locally to avoid `/prototype` command collision. |
| [`review-animations`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/review-animations/SKILL.md) | `review-animations` | Imported; Explicitly invoked, read-only animation review. |
| [`write-swift`](https://github.com/emilkowalski/skills/blob/d16ebe60d09a5ba2afcb7054ede9d0a10c9f6128/skills/write-swift/SKILL.md) | `write-swift` | Imported; Swift-specific implementation and review. |

All thirteen skills are optional and remain available through the canonical `.ai/skills/` source and generated vendor projections. Concise, platform-specific descriptions keep the Codex skill index within its 8,000-byte budget. The upstream `prototype` skill is named `ui-prototype` locally to avoid colliding with the existing `/prototype` workflow command. Three narrow workflow adaptations apply: `animate-expo` uses the declared package manager; `improve-animations` and its plan template store candidate plans under the task workspace and hand execution to the canonical approved workflow; and `ui-prototype` records evidence and routes production work through that workflow. Other skill bodies and companion files are unchanged.

Companion files are included beside their skills: `animate/RECIPES.md`, `animate-expo/RECIPES.md`, `ask-sonner/API.md`, `improve-animations/AUDIT.md`, `improve-animations/PLAN-TEMPLATE.md`, `ui-prototype/PICKER.md`, and `review-animations/STANDARDS.md`. The upstream MIT license is preserved at [`licenses/emilkowalski-skills-MIT.txt`](../licenses/emilkowalski-skills-MIT.txt).

Local workflow contracts still govern execution: these skills do not bypass discovery, an approved plan, human authorization, TDD, review, quality gates, or cross-model QA. Read-only audit and review skills remain read-only. Expo, mobile-web, Sonner, and Swift guidance should only be used when the project actually uses those technologies. No dependency or external service is installed by this intake.

## Upstream refresh — 2026-10-11

Compared current upstream trees and commit diffs against the previously recorded revisions: Emil at `2d228630ba1446365f614a108cb8252f1feda202`, Matt at `49dd158d1076134a641b33efb035946536778336`. Neither comparison changes the root license. This is a selective intake, not a blanket upgrade.

| Upstream addition/change | Local decision |
| --- | --- |
| Emil `break-ui` (added 2026-10-02) | Import skill and catalog; executor owns dev-only fixtures/toggle, reviewers report findings, fixes follow the authorized workflow. Point to local `ui-prototype`. |
| Emil `animation-performance` (added 2026-10-11) | Optional web diagnosis; remove canned pause/persona, qualify browser/library acceleration, preserve layout/accessibility semantics and active project profiles. Real-device improvements require measurements. |
| Matt `retro` (promoted to `engineering`) | Adapted knowledge skill plus `/retro`: session evidence, deterministic checks for mechanical failures, read-only reviewers and canonical execution for accepted changes. |
| Matt `pr` (promoted) | Original summary in `docs/pr-descriptions.md`, routed from `pre-pr`. Preserve Humanlayer provenance; no upstream template/examples copied. |
| Matt `implement-spec` (promoted) | Deferred; parallel worktree/merger orchestration needs separate compatibility design. |
| Matt experimental `chief-of-staff` | Not imported; compulsory delegation and proactive environment work widen coding tasks. |
| Matt `diagnosing-bugs` | Verify a forced temporary mutation landed before trusting the failure; restore it and verify the original scenario. |
| Matt `tdd` | State what each test boundary catches/misses; retain local Red–Green–Refactor and settled authorization. |
| Matt `code-review` | Search applicable standards/contribution guidance; retain existing reviewer roles. |
| Matt `to-tickets` | Native Linear parent/sub-issue and blocking edges; no imported GitHub triage labels. |
| Matt `implement` | Fetch a passed issue identifier and state its title before execution. |
| Matt `grilling` | A yes/no recommendation is phrased so yes accepts it; preserve multi-option decisions. |
| Matt glossary/handoff/setup changes | Keep local domain/context paths and durable task artifacts; no provider-specific installer replacement. |
| Matt removal of `resolving-merge-conflicts` | Keep the locally maintained `/resolve-conflicts` command. |

The flat `.ai/skills/<name>/` layout is retained. Generate Cursor, portable/Codex and Hermes projections, including the catalog. `/retro` is a canonical command linked from the skill/catalog; this content intake does not change the hardcoded Copilot prompt map.

Representative review scenarios: a read-only break-ui reviewer proposes preparation rather than editing fixtures; authorized preparation stays dev-only; performance findings distinguish inspection from profiling; a retro with no session evidence states the gap; strict React rules remain optional; PR-writing guidance cannot waive exact-SHA gates.

Downstream propagation is a release step after canonical independent QA. Review the README's nine destinations through their own canonical layout and generator, pin the approved source commit, and record applicability. Do not distribute an unreviewed canonical snapshot.

Validation for this intake: typecheck, lint, all 9 existing tests, architecture, dead-code, duplication and ratchet checks passed. Vendor parity, Codex adapter/index checks (5,702 / 8,000 bytes, 32 skills), dogfood and whitespace checks passed. These are instruction-content changes; no runtime logic, dependency or folder-layout change is included. UI/device scenarios above were reviewed as instruction paths, not executed against a product UI.

Review limitation and maintainer direction: the current host does not expose a verified exact implementer model identifier, so this run cannot satisfy verified cross-model evidence or claim a passing `prepr:gate`. After this limitation was disclosed, the maintainer explicitly directed creation, review and merge of this PR on 2026-10-12. Treat that direction as an exception for this content-only intake, not a change to the repository gates. Perform an independent read-only agent review, inspect CI and publish the limitation with the review; do not fabricate model metadata or gate approval. Downstream propagation is tracked separately after the canonical merge.

## Maintainer intake checklist

1. Compare source revisions and read relevant changes, including license/credit changes.
2. Map each proposal to existing skills or a precise missing recurring task.
3. Adapt local contracts first; record conflicts and excluded behavior here.
4. Edit canonical content and regenerate adapters.
5. Validate frontmatter, references, vendor parity, skill-index budget and representative task behavior.
6. Run repository quality and cross-model QA gates before release. Keep evidence and limitations in the PR.

## Public profile preparation

The repository now uses the root [MIT License](../LICENSE) for its original content. The third-party notice retains Matt Pocock's MIT attribution. Training materials are summarized in original language rather than copied into this repository. The README and workflow guide describe actual contents, without claims of industry endorsement or proven vendor compatibility.
