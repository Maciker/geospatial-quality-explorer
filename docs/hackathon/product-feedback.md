# Product Feedback — author-review draft

Ticket: [MAC-371](https://linear.app/maciker/issue/MAC-371). Internal review cutoff: **21 October 2026**. Sources: [friction log](friction-log.md), source code and the final smoke evidence. The author must confirm the proposed reuse decisions before submission. No onboarding times or provider performance metrics have been measured for this draft.

## Summary

I built a labeled Alexa+ web simulation using a TypeScript validation core, a React/MapLibre interface, a server-side OpenAI-compatible model connection through NaN, and Vercel hosting. I did not use gated Alexa+ developer tools or an official Alexa device integration.

The issues below distinguish our application integration from defects in external tools. The environment-variable mismatch was between **our internal ADR and task brief**, not a verified problem in Amazon documentation. Likewise, loopback routing and CORS were our own middleware responsibilities.

## Tools used and feedback

Each row covers purpose, positive outcome, friction, onboarding evidence, and a proposed reuse decision for the author to confirm.

| Tool / API / SDK | Purpose and what worked | What needs work | Onboarding | Use again? (author to confirm) |
| --- | --- | --- | --- | --- |
| TypeScript / Node.js / pnpm | Shared contracts and deterministic checks across CLI, API and conversation tools. | Keep reproducible setup and errors documented. No new runtime defect claimed. | Extended the existing codebase; no new measured setup duration. | Yes: preserve shared contracts and the bounded core. |
| React / Vite | Conversation, list and selected-finding detail. | Isolate map initialization so a browser limitation cannot blank the whole product. | Existing UI was extended, not a fresh onboarding experiment. | Yes, with failure isolation verified. |
| MapLibre GL JS | Source layer, findings overlay and selection in geographic context. | The review browser could not create WebGL; our integration originally left that exception uncaught. This is not evidence of a MapLibre defect. | Real map behavior is covered by browser tests; browser capability fallback needed explicit attention. | Yes, with an accessible non-map workflow. |
| NaN OpenAI-compatible API | Server-side tool orchestration; separately labeled deterministic mock for offline reproduction. | Our internal env-variable naming differed. Current latency and provider availability must be measured in the final live smoke. | Configuration now accepts documented names and aliases; no timing estimate is claimed. | Yes for further evaluation, subject to measured reliability. |
| Vercel | Static simulation and bounded serverless routes. | Our existing loopback guard, CORS ordering and process-memory assumptions required adaptation. | Existing API was adapted; see the dated internal integration incidents. | Yes for this bounded demo with tested recovery and explicit limits. |
| QGIS 3 | Intended desktop continuation using project, style, findings and metadata export. | Opening the final downloaded bundle still requires a real desktop check. | Do not claim final desktop inspection until recorded. | Confirm after opening that bundle. |
| PostGIS (full local review only) | Stored validation runs and spatial indexing; not required for the hosted simulation. | Not part of the hosted-demo walkthrough. | Reuses the existing local path; no new measured onboarding conclusion. | Confirm from actual local use if included in the form. |

Data/services: Natural Earth provides the geographic sample; OpenFreeMap provides basemap context. Preserve their provenance and attribution. The sample's introduced errors are ours, not upstream defects. Confirm current basemap terms before relying on them in the final published media.

Media tools: record the actual narrator/tool and applicable rights in the final package. Do not infer the original voice model from a filename. Replacement narration prepared in this task uses Kokoro-ONNX with the `af_heart` voice, as production voiceover, not live microphone input.

## Friction evidence

### 1. Internal model configuration naming

Our early ADR used `ALEXA_SIM_LLM_*`, while our internal brief used `NAN_*`. A missing key selected the deterministic mock, which was initially easy to mistake for a failed live-model connection. The app accepts both prefixes and labels its active mode. Recommendation for **our repo**: publish one canonical configuration block and describe aliases and mock behavior. [Dated evidence](friction-log.md#entry-2026-10-12--dual-env-var-names-for-nan-llm).

### 2. Internal public/local routing boundary

Our existing loopback guard initially blocked the new public simulation route; OPTIONS handling also required the dedicated CORS path. The correction was in our own router ordering. Recommendation: keep local-only and public simulation routers explicit, and test preflight handling. This is not a verified Amazon or Vercel service error. [Dated evidence](friction-log.md#entry-2026-10-12--loopback-guard-vs-public-alexa-routes).

### 3. WebGL-unavailable browser

Opening the production demo in the review browser produced a blank page with `Failed to initialize WebGL`. Reloading once reproduced it. The source correction isolates the constructor failure and leaves chat/list/export available. Final production verification is still required; do not describe the deployed incident as resolved before that smoke. [MAC-460](https://linear.app/maciker/issue/MAC-460) and the new [friction entry](friction-log.md#entry-2026-10-18--webgl-startup-blanks-the-simulation).

## Optional feature request

A public, ungated example of a simulated experience with bounded tools and clear live/mock labeling would help builders understand the permitted route. This is a request, not a claim that an official starter or SDK was broken. Priority: nice-to-have.

The friction log is optional and may receive up to a 10% bonus under the rules. Inclusion does not guarantee a bonus or a prize.
