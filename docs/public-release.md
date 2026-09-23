# Public release checklist

Changing GitHub visibility is an owner action. This change does not publish to npm, change visibility, delete branches, rewrite history or enable repository security settings.

## Repository checks

- Run pnpm install --frozen-lockfile, pnpm doctor, pnpm build, pnpm quality:full and pnpm quality:stabilization from a clean checkout.
- Regeneration must leave no tracked changes or new non-ignored files.
- Inspect the PR diff and obtain independent cross-model QA for agent-generated changes. Missing evidence is not a passing gate.
- Keep package.json private: true: the deliverable is a GitHub workflow repository, not an npm release.
- Retain LICENSE, THIRD_PARTY_NOTICES.md and licenses/mattpocock-skills-MIT.txt. Review provenance before adding any other training material.
- Verify every branch, tag and reachable historical commit for secrets and private material; also review PR/issue discussions, attachments and release assets. A filename inspection or vendor check alone is insufficient.

## Owner settings

Before changing visibility, inspect the proposed publication diff and resolve any reported blockers. Then:

1. Change repository visibility manually.
2. Enable GitHub private vulnerability reporting and available secret-scanning/push-protection features.
3. Require PRs and successful Quality checks on main using branch protection or a ruleset where the account plan permits. Configure the actual check names after the first successful run.
4. Decide whether to mark this repository as a GitHub template. This is optional.
5. Review old branches. A merged branch does not need deletion to publish; deletion is not a secret-removal strategy.

## Validation boundaries

GitHub CI exercises Node 22 and 24 using the pinned pnpm version and frozen lockfile. It does not contact model providers or start MCP servers.
dogfood:check is a structural/scaffold check, not an end-to-end test of every tool or vendor. Instructions and generated adapters need live runtime testing before compatibility claims.

The harness still requires human supervision: the loop produces correction artifacts; it does not itself implement fixes. The worktree sandbox isolates a checkout, not operating-system permissions.

## Preparation evidence — 2026-09-20

Base reviewed: `aef3f9b210a83d8648b46da40ddfa63b717ce6b7`.

- Reconstructed the checkout from authenticated GitHub reads and verified its Git tree exactly matched `1ec8f1b00fb552b98e473ede7540790e159c8a4d` before changes.
- On Node 24.19.0 and pnpm 10.17.1: frozen installation, build, doctor, quality:full and quality:stabilization passed. Vitest passed both tests. The new MCP regression test failed against the old generator and passed after the fix.
- The exact pinned MCP packages installed and their `--help` commands succeeded. This is CLI smoke evidence, not a live MCP session in each vendor.
- An independent read-only agent review found no blocking introduced issues. It is not evidence of a different-model review.
- Inspected all refs returned by GitHub: three branches, six PR head refs and no tags. Examined 23 unique reachable commits, 19 trees and 384 unique text blobs, including unmerged PR heads. Pattern checks for private keys, common provider/GitHub/AWS/Slack tokens, credentials in URLs and literal credential assignments found no matches. Issue/PR body checks also found no matches.
- This was a targeted pattern scan, not a dedicated secret-scanner certification or a complete audit of attachments, private review discussions, provider-side data or inaccessible refs. Do not infer absence of all sensitive material.

Before merge, obtain a real cross-model review of the final PR diff and check the hosted CI results. No AI provider credentials were configured in the preparation environment, so quality:agent has not been certified. Visibility remains an owner decision.
