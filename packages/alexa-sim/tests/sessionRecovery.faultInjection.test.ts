import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BoundedSessionQualityToolsAdapter } from "../../alexa-tools/src/infrastructure/BoundedSessionQualityToolsAdapter.js";
import { ConversationalLoop } from "../src/application/ConversationalLoop.js";
import { DeterministicMockLlm } from "../src/infrastructure/DeterministicMockLlm.js";
import { FixedWindowRateLimiter } from "../src/infrastructure/FixedWindowRateLimiter.js";
import { handleAlexaSimHttp, type HttpLikeRequest } from "../src/infrastructure/handleAlexaSimHttp.js";
import { LlmUnavailableError } from "../src/infrastructure/NanOpenAiLlmClient.js";
import type { LlmPort } from "../src/application/LlmPort.js";

const fixturesDirectory = join(dirname(fileURLToPath(import.meta.url)), "../../quality/fixtures/vector");

function createAdapter(): BoundedSessionQualityToolsAdapter {
  return new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
}

function createLoop(tools: BoundedSessionQualityToolsAdapter, llm: LlmPort = new DeterministicMockLlm()): ConversationalLoop {
  return new ConversationalLoop({ tools, llm, timeoutMs: 20_000 });
}

type Captured = { status: number; body: string; headers: Record<string, string> };

function fakeResponse() {
  const captured: Captured = { status: 0, body: "", headers: {} };
  const response = {
    status(code: number) {
      captured.status = code;
      return response;
    },
    setHeader(name: string, value: string) {
      captured.headers[name] = value;
    },
    end(body?: string) {
      captured.body = body ?? "";
    },
  };
  return { response, captured };
}

async function sendChat(
  body: unknown,
  rateLimiter: FixedWindowRateLimiter,
  clientAddress = "203.0.113.40",
): Promise<Captured> {
  const request: HttpLikeRequest = {
    method: "POST",
    headers: {},
    body: JSON.stringify(body),
    pathname: "/api/v1/alexa-sim/chat",
    clientAddress,
  };
  const { response, captured } = fakeResponse();
  await handleAlexaSimHttp(request, response, { rateLimiter });
  return captured;
}

describe("session recovery fault injection", () => {
  it("recovers validate→list→explain→export on instance B without A's memory", async () => {
    const instanceA = createAdapter();
    const instanceB = createAdapter();
    const validated = await createLoop(instanceA).run({
      messages: [{ role: "user", content: "Validate the portfolio fixture." }],
    });
    expect(validated.runId).toMatch(/^[a-f0-9]{64}$/);
    expect(await instanceB.describeSession(validated.sessionId)).toBeNull();

    const recovered = await createLoop(instanceB).run({
      sessionId: validated.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: validated.assistantMessage },
        { role: "user", content: "Validate the portfolio fixture." },
      ],
    });
    expect(recovered.sessionId).toBe(validated.sessionId);
    expect(recovered.runId).toMatch(/^[a-f0-9]{64}$/);
    expect(recovered.refused).toBe(false);
    expect(recovered.assistantMessage.toLowerCase()).not.toContain("session expired");

    const listed = await createLoop(instanceB).run({
      sessionId: recovered.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: recovered.assistantMessage },
        { role: "user", content: "List the findings." },
      ],
    });
    expect(listed.findings.length).toBeGreaterThan(0);
    expect(listed.refused).toBe(false);
    const listedIds = listed.findings.map((finding) => finding.findingId);

    const explained = await createLoop(instanceB).run({
      sessionId: recovered.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: recovered.assistantMessage },
        { role: "user", content: "List the findings." },
        { role: "assistant", content: listed.assistantMessage },
        { role: "user", content: "Explain the next finding." },
      ],
    });
    expect(explained.refused).toBe(false);
    expect(listedIds.some((id) => explained.assistantMessage.includes(id))).toBe(true);

    const exported = await createLoop(instanceB).run({
      sessionId: recovered.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: recovered.assistantMessage },
        { role: "user", content: "Export QGIS." },
      ],
    });
    expect(exported.qgisExport).not.toBeNull();
    expect(exported.qgisExport?.runId).toBe(recovered.runId);
  });

  it("does not treat app rate limit as session expiry after a session exists", async () => {
    let now = 0;
    const rateLimiter = new FixedWindowRateLimiter({ limit: 2, windowMs: 60_000, now: () => now });
    const first = await sendChat({ messages: [{ role: "user", content: "Validate the portfolio fixture." }] }, rateLimiter);
    expect(first.status).toBe(200);
    const sessionId = (JSON.parse(first.body) as { sessionId: string }).sessionId;
    expect(sessionId.length).toBeGreaterThan(0);

    await sendChat({ sessionId, messages: [{ role: "user", content: "List the findings." }] }, rateLimiter);
    const limited = await sendChat({ sessionId, messages: [{ role: "user", content: "List the findings." }] }, rateLimiter);
    expect(limited.status).toBe(429);
    expect(limited.headers["Retry-After"]).toBeDefined();
    const limitedBody = JSON.parse(limited.body) as { error: string };
    expect(limitedBody.error).toBe("rate_limited");
    expect(limitedBody.error).not.toBe("session_expired");

    now = 60_000;
    const resumed = await sendChat(
      {
        sessionId,
        messages: [
          { role: "user", content: "Validate the portfolio fixture." },
          { role: "assistant", content: "ok" },
          { role: "user", content: "List the findings." },
        ],
      },
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
    await expect(
      createLoop(tools, failingLlm).run({
        messages: [{ role: "user", content: "Validate the portfolio fixture." }],
      }),
    ).rejects.toBeInstanceOf(LlmUnavailableError);

    const recovered = await createLoop(tools).run({
      messages: [{ role: "user", content: "Validate the portfolio fixture." }],
    });
    expect(recovered.runId).toMatch(/^[a-f0-9]{64}$/);
    expect(recovered.refused).toBe(false);
  });

  it("revalidates a named catalog fixture once after reopen on instance B", async () => {
    const instanceA = createAdapter();
    const instanceB = createAdapter();
    const validated = await createLoop(instanceA).run({
      messages: [{ role: "user", content: "Validate the portfolio fixture." }],
    });

    const recovered = await createLoop(instanceB).run({
      sessionId: validated.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: validated.assistantMessage },
        { role: "user", content: "Please check the clean fixture." },
      ],
    });

    expect(recovered.sessionId).toBe(validated.sessionId);
    expect(recovered.runId).toMatch(/^[a-f0-9]{64}$/);
    expect(recovered.refused).toBe(false);
    expect(recovered.assistantMessage.toLowerCase()).toContain("clean");
    expect(recovered.runId).not.toBe(validated.runId);
  });

  it("prompts choose/revalidate when the session is gone and no catalog fixture is named", async () => {
    const instanceA = createAdapter();
    const instanceB = createAdapter();
    const validated = await createLoop(instanceA).run({
      messages: [{ role: "user", content: "Validate the portfolio fixture." }],
    });

    const orphaned = await createLoop(instanceB).run({
      sessionId: validated.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: validated.assistantMessage },
        { role: "user", content: "List the findings." },
      ],
    });
    expect(orphaned.runId).toBeNull();
    expect(orphaned.findings).toEqual([]);
    expect(orphaned.refused).toBe(true);
    expect(orphaned.assistantMessage.toLowerCase()).toMatch(/revalidate|choose|session|again/);
    expect(orphaned.assistantMessage.toLowerCase()).not.toMatch(/session expired.*session expired/);
  });

  it("does not treat export questions or negations as run-scoped recovery on a dead session", async () => {
    const instanceA = createAdapter();
    const instanceB = createAdapter();
    const validated = await createLoop(instanceA).run({
      messages: [{ role: "user", content: "Validate the portfolio fixture." }],
    });

    const question = await createLoop(instanceB).run({
      sessionId: validated.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: validated.assistantMessage },
        { role: "user", content: "How does the export work?" },
      ],
    });
    expect(question.refused).toBe(false);
    expect(question.assistantMessage.toLowerCase()).not.toMatch(/no longer has a validated run/);

    const negated = await createLoop(instanceB).run({
      sessionId: validated.sessionId,
      messages: [
        { role: "user", content: "Validate the portfolio fixture." },
        { role: "assistant", content: validated.assistantMessage },
        { role: "user", content: "Don't export yet." },
      ],
    });
    expect(negated.refused).toBe(false);
    expect(negated.assistantMessage.toLowerCase()).not.toMatch(/no longer has a validated run/);
  });
});
