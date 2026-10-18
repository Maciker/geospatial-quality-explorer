# Devpost submission draft

Internal review cutoff: **21 October 2026**. Submit before **23 October, 21:00 Europe/Madrid**. Review facts against the final deployed build; this document does not certify a live smoke or QGIS desktop inspection.

## Project name

Geospatial Quality Explorer

## Tagline

Review spatial data through conversation, inspect cited findings on a map, and take the results into QGIS.

## Inspiration

A GIS reviewer needs more than a statement that a file is invalid. They need to locate the affected feature, understand the rule that failed, and preserve the evidence for the next person who handles the data.

I explored a conversational interface for this review task. The assistant coordinates a bounded workflow while a deterministic engine performs the checks. The map and finding identifiers keep the conversation connected to the data.

## What it does

Geospatial Quality Explorer is a labeled Alexa+ web simulation for reviewing small vector datasets.

A reviewer can ask the assistant to validate a dataset from the built-in catalog, inspect findings on the map and in a list, explain a selected finding, and export the current review as a QGIS bundle.

The demonstration uses a Natural Earth sample of Western Europe with deliberately introduced errors. It includes an invalid polygon, duplicate identifiers, and a feature without geometry. These are controlled demonstration errors, not a claim about the quality of the original Natural Earth dataset.

Each finding records its rule and feature identifiers. The review also retains source and ruleset metadata. The assistant explains tool results; it does not decide geometry validity or edit the source.

## Why a conversational interface

The intended user is a GIS analyst reviewing a vector delivery. Conversation provides a way to move from a request to a specific finding and then to an export, while the map supplies the visual context.

The interaction is deliberately multimodal: use the conversation to request an action, the map or list to select evidence, and QGIS to continue the review. This prototype explores that handoff; it does not claim a measured productivity improvement.

## How we built it

A TypeScript validation core is shared by the CLI, browser review, and conversational tools. The simulation exposes bounded operations for listing fixtures, running validation, listing findings, explaining a finding, and exporting QGIS.

The React interface uses MapLibre for spatial context. A server-side OpenAI-compatible model connection through NaN coordinates tool calls when configured. A separately labeled deterministic mock supports local reproduction without a model key.

The hosted simulation runs on Vercel and uses bundled datasets. It does not require PostGIS; the fuller local review path can use PostGIS. The hosted simulation accepts the reviewed fixture catalog rather than arbitrary file uploads.

This submission uses the permitted simulated-experience route. It is not an official Alexa skill, a certified Amazon product, or an implemented MCP integration.

## Challenges we ran into

Combining a public conversational demo with an existing local API required careful routing and configuration. Our own documents initially used inconsistent model environment-variable names; we corrected the application configuration rather than treating that as a defect in Amazon documentation.

Serverless execution also made session behavior and recovery important. The final delivery includes a bounded dataset catalog and clear limits, rather than a claim of unrestricted production readiness.

During final review, a browser without an available WebGL context exposed a map-initialization failure that blanked the interface. The source now isolates that startup failure and preserves the non-map workflow. The production smoke remains a separate delivery check.

## Accomplishments

The same validation logic supports command-line and conversational review. The demonstration connects a selected spatial finding to its rule explanation, and the export carries review artifacts for use in QGIS.

The source is available under MIT. Synthetic fixtures and Natural Earth samples have separate provenance and licensing information.

## What we learned

The most useful part of an assistant in this workflow is keeping requests attached to evidence. The model does not need to calculate geometry to help a reviewer navigate a quality report.

Reproducible datasets and explicit simulation labeling also make it easier to distinguish product behavior, model behavior, and the scope of the demo.

## What's next

Improve resilience across browser capabilities, verify the handoff with GIS reviewers, and evaluate where conversation helps compared with the existing map and CLI workflows. Durable sessions and official integration routes would be separate future work.

## Built with

TypeScript, Node.js, React, Vite, MapLibre GL JS, QGIS, NaN OpenAI-compatible API, Vercel. PostGIS supports the fuller local review path and is not required for the hosted simulation.

## Links

- Repository: https://github.com/Maciker/geospatial-quality-explorer
- Demo: https://geospatial-quality-explorer.vercel.app/?sim=alexa
- Video: add the reviewed public YouTube/Vimeo URL before submission.

## Hackathon contribution

The conversational simulation, bounded tool interface, deployment path, dataset provenance, connected map/finding review, and delivery documentation are the work to describe with dated commits or PRs. Record the actual start/end references; do not invent a baseline or claim the entire repository was created during the event.
