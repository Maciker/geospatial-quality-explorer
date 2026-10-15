import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { BoundedSessionQualityToolsAdapter } from "../../alexa-tools/src/infrastructure/BoundedSessionQualityToolsAdapter.js";
import { ConversationalLoop } from "../src/application/ConversationalLoop.js";
import type { LlmCompletionRequest, LlmPort } from "../src/application/LlmPort.js";
import type { ChatMessage } from "../src/domain/chatTypes.js";
import { DeterministicMockLlm, resetDeterministicMockLlmState } from "../src/infrastructure/DeterministicMockLlm.js";

const fixturesDirectory = join(dirname(fileURLToPath(import.meta.url)), "../../quality/fixtures/vector");

/** Delegates to the mock and records what the model would have received. */
function recordingLlm(): { llm: LlmPort; requests: LlmCompletionRequest[] } {
  const mock = new DeterministicMockLlm();
  const requests: LlmCompletionRequest[] = [];
  return {
    requests,
    llm: {
      complete(request) {
        requests.push({ ...request, messages: [...request.messages] });
        return mock.complete(request);
      },
    },
  };
}

async function runScript(loop: ConversationalLoop, steps: readonly string[]) {
  let sessionId: string | undefined;
  const messages: ChatMessage[] = [];
  const responses = [];
  for (const step of steps) {
    messages.push({ role: "user", content: step });
    const response = await loop.run({ ...(sessionId ? { sessionId } : {}), messages: [...messages] });
    sessionId = response.sessionId;
    messages.push({ role: "assistant", content: response.assistantMessage });
    responses.push(response);
  }
  return responses;
}

function toolMessages(requests: readonly LlmCompletionRequest[]): string[] {
  return requests.flatMap((request) => request.messages.filter((message) => message.role === "tool").map((message) => message.content));
}

afterEach(() => {
  resetDeterministicMockLlmState();
});

describe("What the live model receives", () => {
  it("omits QGIS file contents from tool results while the response still carries them", async () => {
    const { llm, requests } = recordingLlm();
    const loop = new ConversationalLoop({ tools: new BoundedSessionQualityToolsAdapter({ fixturesDirectory }), llm });

    const responses = await runScript(loop, ["Validate the portfolio fixture.", "List the findings.", "Export QGIS."]);

    const exported = toolMessages(requests).find((content) => content.includes("findings.qgs"));
    expect(exported).toBeDefined();
    expect(exported).not.toContain("<qgis");
    expect(exported!.length).toBeLessThan(1_000);
    expect(responses.at(-1)?.qgisExport?.files.project).toContain("<qgis");
  });

  it("omits finding geometries from tool results while the cards keep them", async () => {
    const { llm, requests } = recordingLlm();
    const loop = new ConversationalLoop({ tools: new BoundedSessionQualityToolsAdapter({ fixturesDirectory }), llm });

    const responses = await runScript(loop, ["Validate the portfolio fixture.", "List the findings."]);

    expect(toolMessages(requests).some((content) => content.includes("coordinates"))).toBe(false);
    expect(responses.at(-1)?.findings.some((card) => card.geometry !== null)).toBe(true);
  });

  it("tells the model the current run and finding order at the start of a follow-up request", async () => {
    const { llm, requests } = recordingLlm();
    const loop = new ConversationalLoop({ tools: new BoundedSessionQualityToolsAdapter({ fixturesDirectory }), llm });

    const responses = await runScript(loop, ["Validate the portfolio fixture.", "List the findings.", "Explain the next finding."]);

    const runId = responses[0]!.runId!;
    const explainRequest = requests.find((request) => request.messages.some((message) => message.content === "Explain the next finding."));
    const context = explainRequest!.messages.filter((message) => message.role === "system").map((message) => message.content).join("\n");
    expect(context).toContain(runId);
    expect(context).toContain(`${runId}:1:geometry.empty`);
  });

  it("uses user-facing voiceAnswer text on QGIS export tool payloads", async () => {
    const { llm, requests } = recordingLlm();
    const loop = new ConversationalLoop({ tools: new BoundedSessionQualityToolsAdapter({ fixturesDirectory }), llm });

    await runScript(loop, ["Validate the portfolio fixture.", "Export QGIS."]);

    const exportTool = toolMessages(requests).find((content) => content.includes("voiceAnswer") && content.includes("findings.qgs"));
    expect(exportTool).toBeDefined();
    expect(exportTool).toContain("Download the bundle from the simulation panel");
    expect(exportTool).not.toContain("Tell the user");
  });

  it("adds voiceAnswer to explain_finding tool payloads for a single follow-up reply", async () => {
    const { llm, requests } = recordingLlm();
    const loop = new ConversationalLoop({ tools: new BoundedSessionQualityToolsAdapter({ fixturesDirectory }), llm });

    await runScript(loop, ["Validate the portfolio fixture.", "List the findings.", "Explain the next finding."]);

    const explainTool = toolMessages(requests).find((content) => content.includes("voiceAnswer") && content.includes("\"finding\""));
    expect(explainTool).toBeDefined();
    expect(explainTool).toContain("findingId");
    expect(explainTool).not.toContain("coordinates");
  });

  it("keeps the session when the model times out after a tool call", async () => {
    const llm: LlmPort = {
      async complete(request) {
        if (!request.messages.some((message) => message.role === "tool")) {
          return { finishReason: "tool_calls", message: { role: "assistant", content: "", toolCalls: [{ id: "t1", name: "list_fixtures", argumentsJson: "{}" }] } };
        }
        return new Promise((_resolve, reject) => {
          request.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
        });
      },
    };
    const loop = new ConversationalLoop({ tools: new BoundedSessionQualityToolsAdapter({ fixturesDirectory }), llm, timeoutMs: 100 });

    const response = await loop.run({ messages: [{ role: "user", content: "Which fixtures are there?" }] });

    expect(response.assistantMessage).toMatch(/timed out/);
    expect(response.sessionId.length).toBeGreaterThan(0);
  });

  it("accepts a reply that cites an id from the server's session context without a tool call", async () => {
    const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
    const setup = await runScript(new ConversationalLoop({ tools, llm: new DeterministicMockLlm() }), ["Validate the portfolio fixture."]);
    const direct: LlmPort = {
      async complete(request) {
        const context = request.messages.find((message) => message.role === "system" && message.content.includes("priority order"))?.content ?? "";
        const firstId = /order: ([a-f0-9]{64}:\d+:[a-z]+\.[a-z]+)/.exec(context)?.[1] ?? "unknown";
        return { finishReason: "stop", message: { role: "assistant", content: `The first finding is findingId ${firstId}.` } };
      },
    };

    const response = await new ConversationalLoop({ tools, llm: direct }).run({
      sessionId: setup[0]!.sessionId,
      messages: [{ role: "user", content: "Which finding comes first?" }],
    });

    expect(response.refused).toBe(false);
    expect(response.assistantMessage).toContain(`${setup[0]!.runId}:1:geometry.empty`);
  });
});
