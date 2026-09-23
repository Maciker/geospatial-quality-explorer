---
name: grilling
description: Use when the user asks to grill, stress-test, or clarify a plan, decision, or idea before acting.
---

# Grilling

Help the user turn an uncertain plan or decision into an explicit set of choices before acting on it.

Map the decision tree as you talk: identify outcomes, constraints, alternatives, risks, ownership, evidence and reversible next steps. Ask only questions whose prerequisites are already known. Group independent questions into a short round; for each, explain why it matters and state a recommended answer when the available evidence supports one.

Find facts from the repository, supplied material and available tools yourself. Ask the user for decisions, priorities, preferences and information they alone have. Do not re-ask settled answers or use questions to delegate research the agent can perform.

At the end of each round, wait for the user's answers. Recompute the unresolved frontier before asking more. Stop when the material decisions are resolved, or when the remaining uncertainty is explicit and has a concrete owner or next investigation.

Summarize the resulting decision tree, unresolved risks, assumptions and next action. Do not implement, publish, send messages, change issues or alter external systems during grilling unless the user separately authorizes that action.

For code or product work, hand the result to the relevant local workflow: `/discovery` for a PRD, `/to-spec` for settled requirements, `/plan` for implementation, or `/to-tickets` for a multi-session delivery map.

Adapted from Matt Pocock's `grilling`; see repository-root `THIRD_PARTY_NOTICES.md`.
