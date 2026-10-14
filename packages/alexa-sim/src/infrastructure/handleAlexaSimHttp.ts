import { ConversationalLoop } from "../application/ConversationalLoop.js";
import type { AlexaSimChatRequest, ChatMessage } from "../domain/chatTypes.js";
import { createBoundedQualityToolsAdapter } from "./createToolsAdapter.js";
import { createLlmClient } from "./createLlmClient.js";
import { FixedWindowRateLimiter } from "./FixedWindowRateLimiter.js";
import { corsHeadersForRequest, readAlexaSimCorsOrigins } from "./parseCorsOrigins.js";
import { readNanLlmConfig } from "./readNanLlmConfig.js";

export type HttpLikeRequest = {
  readonly method?: string;
  readonly headers: Record<string, string | string[] | undefined>;
  readonly body?: string;
  readonly pathname?: string;
  /** Socket address when the transport knows it; otherwise x-real-ip, then the first x-forwarded-for hop. */
  readonly clientAddress?: string;
};

export type HttpLikeResponse = {
  status(code: number): HttpLikeResponse;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

export const ALEXA_SIM_LIMITS = {
  maxBodyBytes: 65_536,
  maxMessages: 40,
  maxMessageChars: 4_000,
  maxSessionIdChars: 128,
  requestsPerMinute: 20,
} as const;

const sharedRateLimiter = new FixedWindowRateLimiter({
  limit: readRequestsPerMinute(),
  windowMs: 60_000,
});

export async function handleAlexaSimHttp(
  request: HttpLikeRequest,
  response: HttpLikeResponse,
  options: { readonly rateLimiter?: FixedWindowRateLimiter } = {},
): Promise<void> {
  const origin = headerValue(request.headers, "origin");
  const cors = corsHeadersForRequest(origin, readAlexaSimCorsOrigins());
  for (const [name, value] of Object.entries(cors)) {
    response.setHeader(name, value);
  }
  response.setHeader("Content-Type", "application/json");
  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }
  const pathname = request.pathname ?? "/api/v1/alexa-sim/chat";
  if (request.method === "GET" && pathname.endsWith("/health")) {
    response.status(200).end(JSON.stringify({ status: "ok", service: "alexa-sim", llmMode: currentLlmMode() }));
    return;
  }
  if (request.method !== "POST" || !pathname.endsWith("/chat")) {
    response.status(405).end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }
  const decision = (options.rateLimiter ?? sharedRateLimiter).take(clientKey(request));
  if (!decision.allowed) {
    response.setHeader("Retry-After", String(decision.retryAfterSeconds));
    response.status(429).end(JSON.stringify({ error: "rate_limited", message: "Too many requests. Try again shortly." }));
    return;
  }
  const body = request.body ?? "{}";
  if (Buffer.byteLength(body, "utf8") > ALEXA_SIM_LIMITS.maxBodyBytes) {
    response.status(413).end(JSON.stringify({ error: "too_large", message: `Requests are limited to ${ALEXA_SIM_LIMITS.maxBodyBytes} bytes.` }));
    return;
  }
  let raw: unknown;
  try {
    raw = JSON.parse(body) as unknown;
  } catch {
    response.status(400).end(JSON.stringify({ error: "invalid_json" }));
    return;
  }
  const parsed = parseChatRequest(raw);
  if (typeof parsed === "string") {
    response.status(400).end(JSON.stringify({ error: "invalid_request", message: parsed }));
    return;
  }
  const loop = new ConversationalLoop({
    tools: createBoundedQualityToolsAdapter(),
    llm: createLlmClient(),
  });
  const result = await loop.run(parsed);
  response.status(200);
  response.end(JSON.stringify({ ...result, llmMode: currentLlmMode() }));
}

/** Accepts only user and assistant text; tool results and system prompts come from the server. */
function parseChatRequest(raw: unknown): AlexaSimChatRequest | string {
  if (!isRecord(raw) || !Array.isArray(raw.messages)) return "messages array is required.";
  if (raw.messages.length === 0 || raw.messages.length > ALEXA_SIM_LIMITS.maxMessages) {
    return `Send between 1 and ${ALEXA_SIM_LIMITS.maxMessages} messages.`;
  }
  const messages: ChatMessage[] = [];
  for (const message of raw.messages) {
    if (!isRecord(message) || (message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string") {
      return "Each message needs role user or assistant and string content.";
    }
    if (message.content.length > ALEXA_SIM_LIMITS.maxMessageChars) {
      return `Messages are limited to ${ALEXA_SIM_LIMITS.maxMessageChars} characters.`;
    }
    messages.push({ role: message.role, content: message.content });
  }
  if (raw.sessionId === undefined) return { messages };
  if (typeof raw.sessionId !== "string" || raw.sessionId.length > ALEXA_SIM_LIMITS.maxSessionIdChars) {
    return "sessionId must be a short string.";
  }
  return { sessionId: raw.sessionId, messages };
}

/** Disclosed to the UI so a demo never passes the deterministic mock off as a live model. */
function currentLlmMode(): "mock" | "live" {
  return readNanLlmConfig().useMockLlm ? "mock" : "live";
}

function clientKey(request: HttpLikeRequest): string {
  if (request.clientAddress) return request.clientAddress;
  // Vercel sets x-real-ip from the connection; a client-supplied x-forwarded-for hop is only a fallback.
  const platformIp = headerValue(request.headers, "x-real-ip");
  if (platformIp) return platformIp;
  const forwarded = headerValue(request.headers, "x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "anonymous";
}

function readRequestsPerMinute(): number {
  const configured = Number.parseInt(process.env.ALEXA_SIM_RATE_LIMIT_PER_MINUTE ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : ALEXA_SIM_LIMITS.requestsPerMinute;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function headerValue(headers: Record<string, string | string[] | undefined>, name: string): string | undefined {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}
