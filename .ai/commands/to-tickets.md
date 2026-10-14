# To Tickets

Input: $ARGUMENTS (spec, plan or issue).

Read the full source, relevant comments, existing related tickets and current implementation. Produce independently verifiable vertical slices: each delivers a narrow user outcome through the layers it actually needs. Each should fit a fresh agent session. Do not create separate UI/API/database tickets merely because those layers exist.

For every slice, write `.ai/workspace/tasks/<task-id>/tickets/<NN>-<slug>.md` using `.ai/templates/tasks/ticket.md`. Include acceptance criteria, verification, parent reference, scope and real blocking edges. Validate that blockers exist, there are no cycles, and at least one ticket is ready. Do not mark dependent work ready until its blockers are complete.

For a broad incompatible contract migration, use expand → migrate → contract: introduce compatibility, migrate callers in independently green batches, then remove the old contract. Document an integration branch if batches cannot land green independently.

Present the breakdown with reasons for dependencies. Honor approval already given; ask only about material unresolved scope. Publish only within an authorized tracker request, in dependency order with real identifiers. Reconcile existing issues before creating new ones. Do not close the parent merely because tickets were created.

When publishing a breakdown of an existing Linear issue, attach new tickets through Linear's native parent/sub-issue relationship and native blocking edges. A project link or parent URL in prose does not replace those relationships. Preserve the existing team's statuses and labels rather than importing upstream GitHub triage conventions. If the connector cannot set a relationship, report that limitation explicitly.
