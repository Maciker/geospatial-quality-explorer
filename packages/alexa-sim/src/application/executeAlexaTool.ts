import type { QualityToolsPort } from "../../../alexa-tools/src/application/QualityToolsPort.js";
import type { AlexaToolName } from "../../../alexa-tools/src/domain/toolContracts.js";
import type { ToolResult } from "../../../alexa-tools/src/domain/toolErrors.js";

const TOOL_NAMES = new Set<string>([
  "list_fixtures",
  "run_validation",
  "list_findings",
  "explain_finding",
  "export_qgis",
]);

type ToolExecutionOutcome = {
  readonly sessionId: string;
  readonly toolName: AlexaToolName;
  readonly result: ToolResult<unknown>;
};

export async function executeAlexaTool(
  tools: QualityToolsPort,
  toolName: string,
  argumentsJson: string,
  fallbackSessionId: string | undefined,
): Promise<ToolExecutionOutcome> {
  if (!TOOL_NAMES.has(toolName)) {
    const sessionId = fallbackSessionId ?? "unknown";
    return {
      sessionId,
      toolName: "list_fixtures",
      result: {
        ok: false,
        sessionId,
        error: "refused",
        message: `Out-of-scope tool ${toolName}.`,
      },
    };
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(argumentsJson) as Record<string, unknown>;
  } catch {
    const sessionId = fallbackSessionId ?? "unknown";
    return {
      sessionId,
      toolName: toolName as AlexaToolName,
      result: {
        ok: false,
        sessionId,
        error: "invalid_request",
        message: "Tool arguments must be valid JSON.",
      },
    };
  }
  const name = toolName as AlexaToolName;
  switch (name) {
    case "list_fixtures":
      return {
        sessionId: fallbackSessionId ?? "",
        toolName: name,
        result: await tools.listFixtures(
          typeof parsed.sessionId === "string" || fallbackSessionId
            ? { sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : fallbackSessionId! }
            : {},
        ),
      };
    case "run_validation":
      return {
        sessionId: fallbackSessionId ?? "",
        toolName: name,
        result: await tools.runValidation({
          sessionId: String(parsed.sessionId ?? fallbackSessionId ?? ""),
          fixtureId: String(parsed.fixtureId ?? ""),
        }),
      };
    case "list_findings":
      return executeRunScopedTool(name, tools, fallbackSessionId, parsed, (sessionId, runId) => tools.listFindings({
        sessionId,
        runId,
        ...(typeof parsed.limit === "number" ? { limit: parsed.limit } : {}),
        ...(typeof parsed.cursor === "string" ? { cursor: parsed.cursor } : {}),
      }));
    case "explain_finding":
      return {
        sessionId: fallbackSessionId ?? "",
        toolName: name,
        result: await tools.explainFinding({
          sessionId: String(parsed.sessionId ?? fallbackSessionId ?? ""),
          findingId: String(parsed.findingId ?? ""),
        }),
      };
    case "export_qgis":
      return executeRunScopedTool(name, tools, fallbackSessionId, parsed, (sessionId, runId) => tools.exportQgis({ sessionId, runId }));
  }
}

async function executeRunScopedTool<T>(
  toolName: AlexaToolName,
  tools: QualityToolsPort,
  fallbackSessionId: string | undefined,
  parsed: Record<string, unknown>,
  invoke: (sessionId: string, runId: string) => Promise<ToolResult<T>>,
): Promise<ToolExecutionOutcome> {
  const sessionId = String(parsed.sessionId ?? fallbackSessionId ?? "");
  const runId = await resolveRunId(tools, sessionId, parsed.runId);
  return {
    sessionId: fallbackSessionId ?? "",
    toolName,
    result: await invoke(sessionId, runId),
  };
}

async function resolveRunId(tools: QualityToolsPort, sessionId: string, rawRunId: unknown): Promise<string> {
  if (typeof rawRunId === "string" && rawRunId.trim().length > 0) return rawRunId.trim();
  const snapshot = await tools.describeSession(sessionId);
  return snapshot?.runId ?? "";
}
