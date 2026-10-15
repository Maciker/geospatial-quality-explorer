import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { BoundedSessionQualityToolsAdapter } from "../../alexa-tools/src/infrastructure/BoundedSessionQualityToolsAdapter.js";
import { ConversationalLoop } from "../src/application/ConversationalLoop.js";
import type { LlmCompletionResponse, LlmPort } from "../src/application/LlmPort.js";
import { DeterministicMockLlm, resetDeterministicMockLlmState } from "../src/infrastructure/DeterministicMockLlm.js";
import { resetSharedToolsAdapterForTests } from "../src/infrastructure/createToolsAdapter.js";

const fixturesDirectory = join(dirname(fileURLToPath(import.meta.url)), "../../quality/fixtures/vector");
const sharedTools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });

function createLoop(llm: LlmPort): ConversationalLoop {
  return new ConversationalLoop({
    tools: sharedTools,
    llm,
    timeoutMs: 20_000,
  });
}

afterEach(() => {
  resetDeterministicMockLlmState();
  resetSharedToolsAdapterForTests();
});

describe("ConversationalLoop", () => {
  it("cites findingId ruleId and featureId after listing portfolio findings", async () => {
    const loop = createLoop(new DeterministicMockLlm());
    const first = await loop.run({
      messages: [{ role: "user", content: "Please validate the portfolio fixture." }],
    });
    expect(first.sessionId.length).toBeGreaterThan(0);
    expect(first.runId).toMatch(/^[a-f0-9]{64}$/);
    expect(first.refused).toBe(false);
    expect(first.assistantMessage).toContain(first.runId!);
    const second = await loop.run({
      sessionId: first.sessionId,
      messages: [
        { role: "user", content: "Please validate the portfolio fixture." },
        { role: "assistant", content: first.assistantMessage },
        { role: "user", content: "List the findings." },
      ],
    });
    expect(second.findings.length).toBeGreaterThan(0);
    expect(second.refused).toBe(false);
    const sample = second.findings[0]!;
    expect(second.assistantMessage).toContain(sample.findingId);
    expect(second.assistantMessage).toContain(sample.ruleId);
    expect(second.assistantMessage).toContain(sample.featureId);
  });

  it("refuses when explain is called with an invalid finding id", async () => {
    const loop = createLoop(new DeterministicMockLlm());
    const opened = await loop.run({
      messages: [{ role: "user", content: "Validate portfolio fixture." }],
    });
    const result = await loop.run({
      sessionId: opened.sessionId,
      messages: [
        { role: "user", content: "Validate portfolio fixture." },
        { role: "assistant", content: opened.assistantMessage },
        { role: "user", content: "Explain the bogus finding." },
      ],
    });
    expect(result.assistantMessage.toLowerCase()).toMatch(/not|unknown|cannot|invent/);
  });

  it("refuses out-of-scope geometry repair requests without calling tools", async () => {
    const loop = createLoop(new DeterministicMockLlm());
    const result = await loop.run({
      messages: [{ role: "user", content: "Please repair the invalid geometry for me." }],
    });
    expect(result.assistantMessage.toLowerCase()).toContain("out of scope");
  });

  it("keeps context for and the next one", async () => {
    const loop = createLoop(new DeterministicMockLlm());
    const validated = await loop.run({
      messages: [{ role: "user", content: "Validate the portfolio fixture." }],
    });
    const listed = await loop.run({
      sessionId: validated.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: validated.assistantMessage },
        { role: "user", content: "List findings." },
      ],
    });
    const next = await loop.run({
      sessionId: listed.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: validated.assistantMessage },
        { role: "user", content: "List findings." },
        { role: "assistant", content: listed.assistantMessage },
        { role: "user", content: "And the next one?" },
      ],
    });
    expect(listed.findings.length).toBeGreaterThan(1);
    expect(next.assistantMessage).toContain("findingId");
    expect(next.assistantMessage).not.toEqual(listed.assistantMessage);
  });

  it("times out when the LLM never returns", async () => {
    const hangingLlm: LlmPort = {
      complete(request): Promise<LlmCompletionResponse> {
        return new Promise((_resolve, reject) => {
          request.signal?.addEventListener("abort", () => {
            const error = new Error("Aborted");
            error.name = "AbortError";
            reject(error);
          });
        });
      },
    };
    const loop = new ConversationalLoop({
      tools: sharedTools,
      llm: hangingLlm,
      timeoutMs: 40,
    });
    const result = await loop.run({ messages: [{ role: "user", content: "hello" }] });
    expect(result.refused).toBe(true);
    expect(result.assistantMessage.toLowerCase()).toContain("timed out");
  }, 10_000);

  it("allows QGIS export confirmations without citation ids", async () => {
    const validated = await createLoop(new DeterministicMockLlm()).run({
      messages: [{ role: "user", content: "Validate the portfolio fixture." }],
    });
    const exportLlm: LlmPort = {
      async complete(request): Promise<LlmCompletionResponse> {
        if (!request.messages.some((message) => message.role === "tool")) {
          return {
            finishReason: "tool_calls",
            message: {
              role: "assistant",
              content: "",
              toolCalls: [{
                id: "e1",
                name: "export_qgis",
                argumentsJson: JSON.stringify({ sessionId: request.toolSessionId ?? validated.sessionId }),
              }],
            },
          };
        }
        return {
          finishReason: "stop",
          message: {
            role: "assistant",
            content: "The QGIS bundle is ready. Download it from the simulation panel.",
          },
        };
      },
    };
    const exported = await createLoop(exportLlm).run({
      sessionId: validated.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: validated.assistantMessage },
        { role: "user", content: "Export QGIS." },
      ],
    });
    expect(exported.refused).toBe(false);
    expect(exported.qgisExport).not.toBeNull();
    expect(exported.assistantMessage.toLowerCase()).toContain("download");
  });

  it("finishes explain-the-next within two model rounds using enriched tool output", async () => {
    let rounds = 0;
    const mock = new DeterministicMockLlm();
    const llm: LlmPort = {
      complete(request) {
        rounds += 1;
        return mock.complete(request);
      },
    };
    const loop = createLoop(llm);
    const validated = await loop.run({ messages: [{ role: "user", content: "Validate the portfolio fixture." }] });
    const listed = await loop.run({
      sessionId: validated.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: validated.assistantMessage },
        { role: "user", content: "List the findings." },
      ],
    });
    rounds = 0;
    const explained = await loop.run({
      sessionId: listed.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: validated.assistantMessage },
        { role: "user", content: "List the findings." },
        { role: "assistant", content: listed.assistantMessage },
        { role: "user", content: "Explain the next finding." },
      ],
    });
    expect(rounds).toBeLessThanOrEqual(2);
    expect(explained.refused).toBe(false);
    expect(explained.assistantMessage).toContain("findingId");
  });

  it("refuses assistant claims that omit citations", async () => {
    const uncitedLlm: LlmPort = {
      async complete(): Promise<LlmCompletionResponse> {
        return {
          finishReason: "stop",
          message: {
            role: "assistant",
            content: "This dataset has a severe geometry error that you must fix immediately.",
          },
        };
      },
    };
    const loop = createLoop(uncitedLlm);
    const result = await loop.run({ messages: [{ role: "user", content: "Tell me about errors." }] });
    expect(result.refused).toBe(true);
    expect(result.assistantMessage).toContain("findingId");
  });
});
