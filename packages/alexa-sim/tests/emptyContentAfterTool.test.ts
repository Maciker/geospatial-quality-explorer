import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BoundedSessionQualityToolsAdapter } from "../../alexa-tools/src/infrastructure/BoundedSessionQualityToolsAdapter.js";
import { ConversationalLoop } from "../src/application/ConversationalLoop.js";
import type { LlmCompletionResponse, LlmPort } from "../src/application/LlmPort.js";
import { DeterministicMockLlm } from "../src/infrastructure/DeterministicMockLlm.js";
import { blankValidationToolChainLlm, portfolioValidateListMessages } from "./support/conversationalLoopFixtures.js";

const fixturesDirectory = join(dirname(fileURLToPath(import.meta.url)), "../../quality/fixtures/vector");

describe("Empty assistant content after tools", () => {
  it("speaks voiceAnswer when the model returns blank text after explain_finding", async () => {
    const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
    const setup = await new ConversationalLoop({ tools, llm: new DeterministicMockLlm() }).run({
      messages: [{ role: "user", content: "Validate the portfolio fixture." }],
    });
    const listed = await new ConversationalLoop({ tools, llm: new DeterministicMockLlm() }).run({
      sessionId: setup.sessionId,
      messages: portfolioValidateListMessages(setup.assistantMessage),
    });
    const emptyAfterToolLlm: LlmPort = {
      async complete(request): Promise<LlmCompletionResponse> {
        const last = request.messages.at(-1);
        if (last?.role === "user" && last.content.includes("Explain")) {
          const context = request.messages.find((message) => message.content.includes("priority order"))?.content ?? "";
          const firstId = /order: ([a-f0-9]{64}:\d+:[a-z0-9_.]+)/.exec(context)?.[1];
          return {
            finishReason: "tool_calls",
            message: {
              role: "assistant",
              content: "",
              toolCalls: [{
                id: "ex1",
                name: "explain_finding",
                argumentsJson: JSON.stringify({ sessionId: setup.sessionId, findingId: firstId }),
              }],
            },
          };
        }
        return { finishReason: "stop", message: { role: "assistant", content: "" } };
      },
    };

    const explained = await new ConversationalLoop({ tools, llm: emptyAfterToolLlm }).run({
      sessionId: listed.sessionId,
      messages: [
        ...portfolioValidateListMessages(setup.assistantMessage, listed.assistantMessage),
        { role: "user", content: "Explain the next finding." },
      ],
    });

    expect(explained.refused).toBe(false);
    expect(explained.assistantMessage).toContain("findingId");
    expect(explained.assistantMessage).not.toContain("I do not have a response");
  });

  it("uses voiceAnswer for validation when the model stays blank through tool rounds", async () => {
    const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
    const validated = await new ConversationalLoop({ tools, llm: blankValidationToolChainLlm(), maxToolRounds: 4 }).run({
      messages: [{ role: "user", content: "Validate the portfolio fixture." }],
    });

    expect(validated.refused).toBe(false);
    expect(validated.assistantMessage).toContain("runId");
    expect(validated.assistantMessage).not.toContain("I do not have a response");
  });

  it("returns voiceAnswer when the final model call times out after list_findings", async () => {
    const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
    const setup = await new ConversationalLoop({ tools, llm: new DeterministicMockLlm() }).run({
      messages: [{ role: "user", content: "Validate the portfolio fixture." }],
    });
    const slowFinalLlm: LlmPort = {
      async complete(request): Promise<LlmCompletionResponse> {
        if (!request.messages.some((message) => message.role === "tool")) {
          return {
            finishReason: "tool_calls",
            message: {
              role: "assistant",
              content: "",
              toolCalls: [{
                id: "list",
                name: "list_findings",
                argumentsJson: JSON.stringify({ sessionId: setup.sessionId, runId: setup.runId }),
              }],
            },
          };
        }
        return new Promise((_resolve, reject) => {
          request.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
        });
      },
    };

    const listed = await new ConversationalLoop({
      tools,
      llm: slowFinalLlm,
      timeoutMs: 5_000,
      roundTimeoutMs: 50,
      maxToolRounds: 2,
    }).run({
      sessionId: setup.sessionId,
      messages: portfolioValidateListMessages(setup.assistantMessage),
    });

    expect(listed.refused).toBe(false);
    expect(listed.assistantMessage).toContain("findingId");
    expect(listed.findings.length).toBeGreaterThan(0);
  });
});
