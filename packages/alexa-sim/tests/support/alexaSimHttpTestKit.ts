import { FixedWindowRateLimiter } from "../../src/infrastructure/FixedWindowRateLimiter.js";
import {
  handleAlexaSimHttp,
  type HttpLikeRequest,
  type HttpLikeResponse,
} from "../../src/infrastructure/handleAlexaSimHttp.js";

type CapturedHttp = { status: number; body: string; headers: Record<string, string> };

function fakeAlexaSimResponse(): { response: HttpLikeResponse; captured: CapturedHttp } {
  const captured: CapturedHttp = { status: 0, body: "", headers: {} };
  const response: HttpLikeResponse = {
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

export function alexaSimChatRequest(body: unknown, clientAddress = "203.0.113.7"): HttpLikeRequest {
  return {
    method: "POST",
    headers: {},
    body: typeof body === "string" ? body : JSON.stringify(body),
    pathname: "/api/v1/alexa-sim/chat",
    clientAddress,
  };
}

export async function sendAlexaSimHttp(
  request: HttpLikeRequest,
  rateLimiter = new FixedWindowRateLimiter({ limit: 100, windowMs: 60_000 }),
): Promise<CapturedHttp> {
  const { response, captured } = fakeAlexaSimResponse();
  await handleAlexaSimHttp(request, response, { rateLimiter });
  return captured;
}
