import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { createApiServer, isLoopbackAddress, assertLoopbackHost } from "../apps/api/src/server.js";
import { close, listen } from "./httpServer.js";

describe("The GIS API", () => {
  it("reports the service identity and UTC timestamp", async () => {
    const server = createApiServer();
    const base = await listen(server);
    try {
      const response = await fetch(`${base}/health`);
      expect(response.status).toBe(200);
      const body = await response.json() as { status: string; service: string; timestamp: string };
      expect(body.status).toBe("ok");
      expect(body.service).toBe("geospatial-quality-explorer-api");
      expect(Number.isFinite(Date.parse(body.timestamp))).toBe(true);
      expect(body.timestamp.endsWith("Z")).toBe(true);
    } finally {
      await close(server);
    }
  });

  it("allows loopback hosts and rejects public binds", () => {
    expect(isLoopbackAddress("127.0.0.1")).toBe(true);
    expect(isLoopbackAddress("::1")).toBe(true);
    expect(() => assertLoopbackHost("0.0.0.0")).toThrow(/loopback/);
  });

  it("answers 413 to an oversized Alexa simulation request", async () => {
    const server = createApiServer();
    const base = await listen(server);
    try {
      const response = await fetch(`${base}/api/v1/alexa-sim/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "x".repeat(200_000) }] }),
      });
      expect(response.status).toBe(413);
    } finally {
      await close(server);
    }
  });

  it("answers 502 and keeps serving when the live model fails", async () => {
    const provider = createServer((_request, response) => {
      response.statusCode = 500;
      response.end("upstream exploded");
    });
    await new Promise<void>((resolve) => provider.listen(0, "127.0.0.1", resolve));
    const saved = { key: process.env.NAN_API_KEY, url: process.env.NAN_BASE_URL, mock: process.env.ALEXA_SIM_MOCK_LLM };
    process.env.NAN_API_KEY = "sk-test-local";
    process.env.NAN_BASE_URL = `http://127.0.0.1:${(provider.address() as AddressInfo).port}/v1`;
    delete process.env.ALEXA_SIM_MOCK_LLM;
    const server = createApiServer();
    const base = await listen(server);
    try {
      const chat = await fetch(`${base}/api/v1/alexa-sim/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-real-ip": "198.51.100.77" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Validate the portfolio fixture." }] }),
      });
      const health = await fetch(`${base}/health`);
      expect(chat.status).toBe(502);
      expect(health.status).toBe(200);
    } finally {
      await close(server);
      await new Promise<void>((resolve) => provider.close(() => resolve()));
      for (const [name, value] of [["NAN_API_KEY", saved.key], ["NAN_BASE_URL", saved.url], ["ALEXA_SIM_MOCK_LLM", saved.mock]] as const) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    }
  });
});
