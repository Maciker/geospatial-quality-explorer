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
});
