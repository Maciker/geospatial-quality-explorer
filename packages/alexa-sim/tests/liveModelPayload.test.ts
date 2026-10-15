import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BoundedSessionQualityToolsAdapter } from "../../alexa-tools/src/infrastructure/BoundedSessionQualityToolsAdapter.js";
import { ConversationalLoop } from "../src/application/ConversationalLoop.js";
import type { LlmCompletionRequest, LlmPort } from "../src/application/LlmPort.js";
import type { ChatMessage } from "../src/domain/chatTypes.js";
import { compactToolResultForModel, trimTranscriptForModel } from "../src/application/modelPayload.js";
import { stallUntilAbort, textReply, toolCallReply, validatePortfolio } from "./support/conversationalLoopFixtures.js";
import { DeterministicMockLlm } from "../src/infrastructure/DeterministicMockLlm.js";

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

describe("What the live model receives", () => {
  it("omits QGIS file contents from tool results while the response still carries them", async () => {
    const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
    const setup = await validatePortfolio(tools);
    const exported = JSON.stringify(compactToolResultForModel(await tools.exportQgis({ sessionId: setup.sessionId, runId: setup.runId! })));

    const response = await new ConversationalLoop({ tools, llm: new DeterministicMockLlm() }).run({
      sessionId: setup.sessionId,
      messages: [{ role: "user", content: "Export QGIS." }],
    });

    expect(exported).toContain("findings.qgs");
    expect(exported).not.toContain("<qgis");
    expect(exported.length).toBeLessThan(1_000);
    expect(exported).toContain("Download the bundle from the simulation panel");
    expect(response.qgisExport?.files.project).toContain("<qgis");
  });

  it("omits finding geometries from tool results while the cards keep them", async () => {
    const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
    const setup = await validatePortfolio(tools);
    const listed = JSON.stringify(compactToolResultForModel(await tools.listFindings({ sessionId: setup.sessionId, runId: setup.runId! })));

    const response = await new ConversationalLoop({ tools, llm: new DeterministicMockLlm() }).run({
      sessionId: setup.sessionId,
      messages: [{ role: "user", content: "List the findings." }],
    });

    expect(listed).toContain("findingId");
    expect(listed).not.toContain("coordinates");
    expect(response.findings.some((card) => card.geometry !== null)).toBe(true);
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

  it("adds voiceAnswer to explain_finding tool payloads without geometry", async () => {
    const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
    const setup = await validatePortfolio(tools);
    const snapshot = await tools.describeSession(setup.sessionId);
    const findingId = snapshot!.prioritizedFindings[0]!.findingId;

    const explained = JSON.stringify(compactToolResultForModel(await tools.explainFinding({ sessionId: setup.sessionId, findingId })));

    expect(explained).toContain(`"voiceAnswer":"findingId ${findingId}`);
    expect(explained).not.toContain("coordinates");
  });

  it("keeps the session when the model times out after a tool call", async () => {
    const llm: LlmPort = {
      async complete(request) {
        if (!request.messages.some((message) => message.role === "tool")) {
          return { finishReason: "tool_calls", message: { role: "assistant", content: "", toolCalls: [{ id: "t1", name: "list_fixtures", argumentsJson: "{}" }] } };
        }
        return stallUntilAbort(request.signal);
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

  it("replaces an uncited quality claim with the tool's grounded voiceAnswer", async () => {
    const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
    const setup = await runScript(new ConversationalLoop({ tools, llm: new DeterministicMockLlm() }), ["Validate the portfolio fixture."]);
    let calls = 0;
    const inventive: LlmPort = {
      async complete() {
        calls += 1;
        if (calls === 1) {
          return { finishReason: "tool_calls", message: { role: "assistant", content: "", toolCalls: [{ id: "x1", name: "export_qgis", argumentsJson: JSON.stringify({ sessionId: setup[0]!.sessionId }) }] } };
        }
        return { finishReason: "stop", message: { role: "assistant", content: "Done. The dataset has three invalid polygons; the QGIS bundle is ready to download." } };
      },
    };

    const response = await new ConversationalLoop({ tools, llm: inventive }).run({
      sessionId: setup[0]!.sessionId,
      messages: [{ role: "user", content: "Export QGIS." }],
    });

    expect(response.refused).toBe(false);
    expect(response.assistantMessage).toBe("The QGIS export is ready. Download the bundle from the simulation panel.");
    expect(response.qgisExport).not.toBeNull();
  });

  it("refuses an uncited quality claim when no tool produced grounded text", async () => {
    const inventive: LlmPort = {
      async complete() {
        return { finishReason: "stop", message: { role: "assistant", content: "Parcel-7 self-intersects and must be fixed." } };
      },
    };

    const response = await new ConversationalLoop({ tools: new BoundedSessionQualityToolsAdapter({ fixturesDirectory }), llm: inventive }).run({
      messages: [{ role: "user", content: "Is parcel 7 valid?" }],
    });

    expect(response.refused).toBe(true);
    expect(response.assistantMessage).not.toContain("Parcel-7");
  });

  it("never sends the model a tool result without the call that produced it", () => {
    const call = (id: string, count = 1): ChatMessage => ({
      role: "assistant",
      content: "",
      toolCalls: Array.from({ length: count }, (_, index) => ({ id: `${id}${index}`, name: "list_findings", argumentsJson: "{}" })),
    });
    const result = (id: string): ChatMessage => ({ role: "tool", content: "{}", toolCallId: id });
    const transcript: ChatMessage[] = [
      { role: "system", content: "rules" },
      { role: "user", content: "go" },
      call("a"), result("a0"),
      call("b", 2), result("b0"), result("b1"),
      call("c"), result("c0"),
      call("d"), result("d0"),
    ];

    const trimmed = trimTranscriptForModel(transcript);

    const calledIds = new Set(trimmed.flatMap((message) => message.toolCalls?.map((toolCall) => toolCall.id) ?? []));
    const orphans = trimmed.filter((message) => message.role === "tool" && !calledIds.has(message.toolCallId ?? ""));
    expect(orphans).toEqual([]);
    expect(trimmed[0]?.role).toBe("system");
  });

  it("keeps the latest user message when the turn's tool chatter is long", () => {
    const rounds = Array.from({ length: 6 }, (_, index): ChatMessage[] => [
      { role: "assistant", content: "", toolCalls: [{ id: `t${index}`, name: "list_findings", argumentsJson: "{}" }] },
      { role: "tool", content: "{}", toolCallId: `t${index}` },
    ]).flat();

    const trimmed = trimTranscriptForModel([{ role: "system", content: "rules" }, { role: "user", content: "Validate it." }, ...rounds]);

    expect(trimmed.some((message) => message.role === "user" && message.content === "Validate it.")).toBe(true);
  });

  describe("grounding replies in the tool output", () => {
    async function explainWith(reply: (realId: string) => string) {
      const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
      const setup = await validatePortfolio(tools);
      const snapshot = await tools.describeSession(setup.sessionId);
      const realId = snapshot!.prioritizedFindings[1]!.findingId;
      let calls = 0;
      const llm: LlmPort = {
        async complete() {
          calls += 1;
          return calls === 1
            ? toolCallReply("x1", "explain_finding", { sessionId: setup.sessionId, findingId: realId })
            : textReply(reply(realId));
        },
      };
      const response = await new ConversationalLoop({ tools, llm }).run({
        sessionId: setup.sessionId,
        messages: [{ role: "user", content: "Explain the next finding." }],
      });
      return { response, realId, calls: () => calls };
    }

    it("replaces invented ids with the tool's own answer", async () => {
      const { response, realId } = await explainWith(() => "findingId ID001 (identifier.duplicate) on featureId dup-1: the id is reused.");

      expect(response.refused).toBe(false);
      expect(response.assistantMessage).toContain(realId);
      expect(response.assistantMessage).toContain("same-parcel");
      expect(response.assistantMessage).not.toContain("ID001");
      expect(response.assistantMessage).not.toContain("dup-1");
    });

    it("replaces a real finding id paired with an invented feature id", async () => {
      const { response } = await explainWith((realId) => `findingId ${realId} (identifier.duplicate) on featureId dup-1: the id is reused.`);

      expect(response.assistantMessage).not.toContain("dup-1");
      expect(response.assistantMessage).toContain("same-parcel");
    });

    it("speaks the tool's own answer on a tool turn without a second model call", async () => {
      const { response, realId, calls } = await explainWith((id) => `Sure. findingId ${id} (identifier.duplicate) on featureId same-parcel: two features share that id.`);

      expect(response.assistantMessage).toMatch(new RegExp(`^findingId ${realId} \\(identifier\\.duplicate`));
      expect(calls()).toBe(1);
    });

    it("lets a neutral greeting through on a turn without tools", async () => {
      const response = await new ConversationalLoop({
        tools: new BoundedSessionQualityToolsAdapter({ fixturesDirectory }),
        llm: { async complete() { return textReply("Hello! I can validate the portfolio fixture, list findings, explain one, or export QGIS."); } },
      }).run({ messages: [{ role: "user", content: "hello" }] });

      expect(response.refused).toBe(false);
      expect(response.assistantMessage).toMatch(/^Hello!/);
    });

    it("refuses invented counts even when the reply names the real runId", async () => {
      const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
      const setup = await validatePortfolio(tools);
      const response = await new ConversationalLoop({
        tools,
        llm: { async complete() { return textReply(`Validation finished. runId ${setup.runId}. 7 self-intersecting polygons and 3 duplicates.`); } },
      }).run({ sessionId: setup.sessionId, messages: [{ role: "user", content: "How did it go?" }] });

      expect(response.refused).toBe(true);
      expect(response.assistantMessage).not.toContain("7 self-intersecting");
    });

    it("accepts a follow-up that restates a feature from an earlier turn", async () => {
      const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
      const setup = await validatePortfolio(tools);
      const response = await new ConversationalLoop({
        tools,
        llm: { async complete() { return textReply("Feature same-parcel has a duplicate id."); } },
      }).run({ sessionId: setup.sessionId, messages: [{ role: "user", content: "Which feature was that again?" }] });

      expect(response.refused).toBe(false);
    });
  });

  it("states how many findings the list returned", async () => {
    const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
    const setup = await validatePortfolio(tools);
    const response = await new ConversationalLoop({
      tools,
      llm: { async complete() { return toolCallReply("l1", "list_findings", { sessionId: setup.sessionId }); } },
    }).run({ sessionId: setup.sessionId, messages: [{ role: "user", content: "List the findings." }] });

    expect(response.assistantMessage).toMatch(new RegExp(`^${response.findings.length} findings listed\\. Top finding: findingId `));
  });

  it.each<[string, LlmPort["complete"]]>([
    ["only says to wait", async () => textReply("Please wait while I prepare the export.")],
    ["times out", (request) => stallUntilAbort(request.signal)],
  ])("runs a requested export itself when the model %s", async (_case, complete) => {
    const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
    const setup = await validatePortfolio(tools);

    const response = await new ConversationalLoop({ tools, llm: { complete }, roundTimeoutMs: 50 }).run({
      sessionId: setup.sessionId,
      messages: [{ role: "user", content: "Export QGIS." }],
    });

    expect(response.qgisExport?.runId).toBe(setup.runId);
    expect(response.assistantMessage).toBe("The QGIS export is ready. Download the bundle from the simulation panel.");
    expect(response.refused).toBe(false);
  });
});
