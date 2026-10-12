import { ConversationalLoop } from "../application/ConversationalLoop.js";
import type { AlexaSimChatRequest } from "../domain/chatTypes.js";
import { createBoundedQualityToolsAdapter } from "./createToolsAdapter.js";
import { createLlmClient } from "./createLlmClient.js";
import { corsHeadersForRequest, readAlexaSimCorsOrigins } from "./parseCorsOrigins.js";

export type HttpLikeRequest = {
  readonly method?: string;
  readonly headers: Record<string, string | string[] | undefined>;
  readonly body?: string;
  readonly pathname?: string;
};

export type HttpLikeResponse = {
  status(code: number): HttpLikeResponse;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

export async function handleAlexaSimHttp(request: HttpLikeRequest, response: HttpLikeResponse): Promise<void> {
  const origin = headerValue(request.headers, "origin");
  const cors = corsHeadersForRequest(origin, readAlexaSimCorsOrigins());
  for (const [name, value] of Object.entries(cors)) {
    response.setHeader(name, value);
  }
  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }
  const pathname = request.pathname ?? "/api/v1/alexa-sim/chat";
  if (request.method === "GET" && pathname.endsWith("/health")) {
    response.status(200).end(JSON.stringify({ status: "ok", service: "alexa-sim" }));
    return;
  }
  if (request.method !== "POST" || !pathname.endsWith("/chat")) {
    response.status(405).end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }
  let payload: AlexaSimChatRequest;
  try {
    payload = JSON.parse(request.body ?? "{}") as AlexaSimChatRequest;
  } catch {
    response.status(400).end(JSON.stringify({ error: "invalid_json" }));
    return;
  }
  if (!Array.isArray(payload.messages)) {
    response.status(400).end(JSON.stringify({ error: "invalid_request", message: "messages array is required." }));
    return;
  }
  const loop = new ConversationalLoop({
    tools: createBoundedQualityToolsAdapter(),
    llm: createLlmClient(),
  });
  const result = await loop.run(payload);
  response.status(200);
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(result));
}

function headerValue(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}
