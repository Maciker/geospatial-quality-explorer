import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { FixedWindowRateLimiter } from "../src/infrastructure/FixedWindowRateLimiter.js";
import { NanOpenAiLlmClient } from "../src/infrastructure/NanOpenAiLlmClient.js";
import { handleAlexaSimHttp } from "../src/infrastructure/handleAlexaSimHttp.js";
import { resetSharedToolsAdapterForTests } from "../src/infrastructure/createToolsAdapter.js";

const SECRET = "sk-test-SECRET-should-never-leave-the-server";
let provider: Server;
let providerUrl = "";

beforeAll(async () => {
  provider = createServer((request, response) => {
    if (request.url?.startsWith("/garbled")) {
      response.statusCode = 200;
      response.end(`${SECRET} is not json`);
      return;
    }
    response.statusCode = 401;
    response.end(JSON.stringify({ error: `Incorrect API key provided: ${SECRET}` }));
  });
  await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", resolve));
  providerUrl = `http://127.0.0.1:${(provider.address() as AddressInfo).port}/v1`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => provider.close(() => resolve()));
});

const savedEnv = { key: process.env.NAN_API_KEY, url: process.env.NAN_BASE_URL, mock: process.env.ALEXA_SIM_MOCK_LLM };

afterEach(() => {
  for (const [name, value] of [["NAN_API_KEY", savedEnv.key], ["NAN_BASE_URL", savedEnv.url], ["ALEXA_SIM_MOCK_LLM", savedEnv.mock]] as const) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  resetSharedToolsAdapterForTests();
});

async function chat(): Promise<{ status: number; body: string }> {
  const result = { status: 0, body: "" };
  const response = {
    status(code: number) {
      result.status = code;
      return response;
    },
    setHeader() {},
    end(payload?: string) {
      result.body = payload ?? "";
    },
  };
  await handleAlexaSimHttp(
    { method: "POST", headers: {}, body: JSON.stringify({ messages: [{ role: "user", content: "Validate the portfolio fixture." }] }), pathname: "/api/v1/alexa-sim/chat", clientAddress: "198.51.100.20" },
    response,
    { rateLimiter: new FixedWindowRateLimiter({ limit: 10, windowMs: 60_000 }) },
  );
  return result;
}

describe("LLM provider failures", () => {
  it("reports only the provider status, never the provider body", async () => {
    const client = new NanOpenAiLlmClient({ baseUrl: providerUrl, model: "test", apiKey: SECRET, useMockLlm: false });

    const failure = await client.complete({ messages: [{ role: "user", content: "hi" }], tools: [] }).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain("401");
    expect((failure as Error).message).not.toContain(SECRET);
  });

  it("answers 502 with a generic message when the live model fails", async () => {
    process.env.NAN_API_KEY = SECRET;
    process.env.NAN_BASE_URL = providerUrl;
    delete process.env.ALEXA_SIM_MOCK_LLM;
    const { status, body } = await chat();

    expect(status).toBe(502);
    expect(JSON.parse(body)).toMatchObject({ error: "llm_unavailable" });
    expect(body).not.toContain(SECRET);
  });

  it("keeps a garbled provider reply out of the error and the logs", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.NAN_API_KEY = SECRET;
    process.env.NAN_BASE_URL = providerUrl.replace("/v1", "/garbled");
    delete process.env.ALEXA_SIM_MOCK_LLM;
    const { status, body } = await chat();

    expect(status).toBe(502);
    expect(body).not.toContain(SECRET);
    expect(JSON.stringify(logged.mock.calls)).not.toContain(SECRET.slice(0, 8));
    logged.mockRestore();
  });
});
