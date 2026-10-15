import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BoundedSessionQualityToolsAdapter } from "../../alexa-tools/src/infrastructure/BoundedSessionQualityToolsAdapter.js";
import { ConversationalLoop } from "../src/application/ConversationalLoop.js";
import type { LlmPort } from "../src/application/LlmPort.js";
import type { AlexaSimChatResponse } from "../src/domain/chatTypes.js";
import { DeterministicMockLlm } from "../src/infrastructure/DeterministicMockLlm.js";
import { FixedWindowRateLimiter } from "../src/infrastructure/FixedWindowRateLimiter.js";
import { LlmUnavailableError } from "../src/infrastructure/NanOpenAiLlmClient.js";
import { alexaSimChatRequest, sendAlexaSimHttp } from "./support/alexaSimHttpTestKit.js";

const fixturesDirectory = join(dirname(fileURLToPath(import.meta.url)), "../../quality/fixtures/vector");
const VALIDATE = "Validate the portfolio fixture.";

function createAdapter(): BoundedSessionQualityToolsAdapter {
  return new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
}

function createLoop(tools: BoundedSessionQualityToolsAdapter, llm: LlmPort = new DeterministicMockLlm()): ConversationalLoop {
  return new ConversationalLoop({ tools, llm, timeoutMs: 20_000 });
}

async function validateOn(adapter: BoundedSessionQualityToolsAdapter): Promise<AlexaSimChatResponse> {
  return createLoop(adapter).run({ messages: [{ role: "user", content: VALIDATE }] });
}

async function continueOn(
  adapter: BoundedSessionQualityToolsAdapter,
  sessionId: string,
  priorAssistant: string,
  nextUser: string,
): Promise<AlexaSimChatResponse> {
  return createLoop(adapter).run({
    sessionId,
    messages: [
      { role: "user", content: VALIDATE },
      { role: "assistant", content: priorAssistant },
      { role: "user", content: nextUser },
    ],
  });
}

describe("session recovery fault injection", () => {
  it("recovers validate→list→explain→export on instance B without A's memory", async () => {
    const instanceA = createAdapter();
    const instanceB = createAdapter();
    const validated = await validateOn(instanceA);
    expect(validated.runId).toMatch(/^[a-f0-9]{64}$/);
    expect(await instanceB.describeSession(validated.sessionId)).toBeNull();

    const recovered = await continueOn(instanceB, validated.sessionId, validated.assistantMessage, VALIDATE);
    expect(recovered.sessionId).toBe(validated.sessionId);
    expect(recovered.runId).toMatch(/^[a-f0-9]{64}$/);
    expect(recovered.refused).toBe(false);
    expect(recovered.assistantMessage.toLowerCase()).not.toContain("session expired");

    const listed = await continueOn(instanceB, recovered.sessionId, recovered.assistantMessage, "List the findings.");
    expect(listed.findings.length).toBeGreaterThan(0);
    expect(listed.refused).toBe(false);

    const explained = await createLoop(instanceB).run({
      sessionId: recovered.sessionId,
      messages: [
        { role: "user", content: VALIDATE },
        { role: "assistant", content: recovered.assistantMessage },
        { role: "user", content: "List the findings." },
        { role: "assistant", content: listed.assistantMessage },
        { role: "user", content: "Explain the next finding." },
      ],
    });
    const listedIds = listed.findings.map((finding) => finding.findingId);
    expect(explained.refused).toBe(false);
    expect(listedIds.some((id) => explained.assistantMessage.includes(id))).toBe(true);

    const exported = await continueOn(instanceB, recovered.sessionId, recovered.assistantMessage, "Export QGIS.");
    expect(exported.qgisExport).not.toBeNull();
    expect(exported.qgisExport?.runId).toBe(recovered.runId);
  });

  it("does not treat app rate limit as session expiry after a session exists", async () => {
    let now = 0;
    const rateLimiter = new FixedWindowRateLimiter({ limit: 2, windowMs: 60_000, now: () => now });
    const first = await sendAlexaSimHttp(alexaSimChatRequest({ messages: [{ role: "user", content: VALIDATE }] }, "203.0.113.40"), rateLimiter);
    expect(first.status).toBe(200);
    const sessionId = (JSON.parse(first.body) as { sessionId: string }).sessionId;
    expect(sessionId.length).toBeGreaterThan(0);

    await sendAlexaSimHttp(alexaSimChatRequest({ sessionId, messages: [{ role: "user", content: "List the findings." }] }, "203.0.113.40"), rateLimiter);
    const limited = await sendAlexaSimHttp(alexaSimChatRequest({ sessionId, messages: [{ role: "user", content: "List the findings." }] }, "203.0.113.40"), rateLimiter);
    expect(limited.status).toBe(429);
    expect(limited.headers["Retry-After"]).toBeDefined();
    expect((JSON.parse(limited.body) as { error: string }).error).toBe("rate_limited");

    now = 60_000;
    const resumed = await sendAlexaSimHttp(
      alexaSimChatRequest({
        sessionId,
        messages: [
          { role: "user", content: VALIDATE },
          { role: "assistant", content: "ok" },
          { role: "user", content: "List the findings." },
        ],
      }, "203.0.113.40"),
      rateLimiter,
    );
    expect(resumed.status).toBe(200);
    const resumedBody = JSON.parse(resumed.body) as { refused: boolean; findings: unknown[]; assistantMessage: string };
    expect(resumedBody.refused).toBe(false);
    expect(resumedBody.findings.length).toBeGreaterThan(0);
    expect(resumedBody.assistantMessage.toLowerCase()).not.toContain("session expired");
  });

  it("keeps an actionable path after LLM failure before validation completes", async () => {
    const tools = createAdapter();
    const failingLlm: LlmPort = {
      async complete() {
        throw new LlmUnavailableError(429);
      },
    };
    await expect(createLoop(tools, failingLlm).run({ messages: [{ role: "user", content: VALIDATE }] })).rejects.toBeInstanceOf(LlmUnavailableError);

    const recovered = await validateOn(tools);
    expect(recovered.runId).toMatch(/^[a-f0-9]{64}$/);
    expect(recovered.refused).toBe(false);
  });

  it("revalidates a named catalog fixture once after reopen on instance B", async () => {
    const validated = await validateOn(createAdapter());
    const recovered = await continueOn(createAdapter(), validated.sessionId, validated.assistantMessage, "Please check the clean fixture.");
    expect(recovered.sessionId).toBe(validated.sessionId);
    expect(recovered.runId).toMatch(/^[a-f0-9]{64}$/);
    expect(recovered.refused).toBe(false);
    expect(recovered.assistantMessage.toLowerCase()).toContain("clean");
    expect(recovered.runId).not.toBe(validated.runId);
  });

  it("prompts choose/revalidate when the session is gone and no catalog fixture is named", async () => {
    const validated = await validateOn(createAdapter());
    const orphaned = await continueOn(createAdapter(), validated.sessionId, validated.assistantMessage, "List the findings.");
    expect(orphaned.runId).toBeNull();
    expect(orphaned.findings).toEqual([]);
    expect(orphaned.refused).toBe(true);
    expect(orphaned.assistantMessage.toLowerCase()).toMatch(/revalidate|choose|session|again/);
  });

  it("does not revalidate when the user negates validate on a dead session", async () => {
    const validated = await validateOn(createAdapter());
    const negated = await continueOn(createAdapter(), validated.sessionId, validated.assistantMessage, "Don't validate the portfolio.");
    expect(negated.runId).toBeNull();
    expect(negated.assistantMessage.toLowerCase()).not.toContain("validation finished");
  });

  it("does not treat export questions or negations as run-scoped recovery on a dead session", async () => {
    const validated = await validateOn(createAdapter());
    const sessionId = validated.sessionId;
    const prior = validated.assistantMessage;
    for (const nextUser of ["How does the export work?", "Don't export yet."]) {
      const reply = await continueOn(createAdapter(), sessionId, prior, nextUser);
      expect(reply.refused).toBe(false);
      expect(reply.assistantMessage.toLowerCase()).not.toMatch(/no longer has a validated run/);
    }
  });
});
