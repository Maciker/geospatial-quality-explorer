import type { OpenAiToolDefinition } from "./LlmPort.js";

export const ALEXA_QUALITY_TOOL_DEFINITIONS: readonly OpenAiToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "list_fixtures",
      description: "List CC0 catalog fixtures available for deterministic validation demos.",
      parameters: {
        type: "object",
        properties: {
          sessionId: { type: "string", description: "Existing session id, if any." },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_validation",
      description: "Run vector-core validation on a catalog fixture and store the run in the session.",
      parameters: {
        type: "object",
        properties: {
          sessionId: { type: "string" },
          fixtureId: { type: "string" },
        },
        required: ["sessionId", "fixtureId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_findings",
      description: "Return prioritized findings for a stored validation run.",
      parameters: {
        type: "object",
        properties: {
          sessionId: { type: "string" },
          runId: { type: "string" },
          limit: { type: "number" },
          cursor: { type: "string" },
        },
        required: ["sessionId", "runId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "explain_finding",
      description: "Fetch one finding by findingId from the session.",
      parameters: {
        type: "object",
        properties: {
          sessionId: { type: "string" },
          findingId: { type: "string" },
        },
        required: ["sessionId", "findingId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "export_qgis",
      description: "Build a QGIS bundle for the session's validation run without writing to disk.",
      parameters: {
        type: "object",
        properties: {
          sessionId: { type: "string" },
          runId: { type: "string", description: "Optional; defaults to the session's latest run." },
        },
        required: ["sessionId"],
        additionalProperties: false,
      },
    },
  },
];
