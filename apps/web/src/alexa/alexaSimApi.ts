export type AlexaChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AlexaFindingCard = {
  findingId: string;
  ruleId: string;
  featureId: string;
  severity: string;
  explanation: string;
  suggestedAction: string;
  geometry: unknown;
};

export type AlexaChatResponse = {
  sessionId: string;
  assistantMessage: string;
  findings: AlexaFindingCard[];
  runId: string | null;
  refused: boolean;
  /** "mock" is the deterministic scripted model used without an API key. */
  llmMode?: "mock" | "live";
  qgisExport: {
    runId: string;
    files: {
      geojson: string;
      metadata: string;
      project: string;
      style: string;
    };
  } | null;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export type AlexaSimHttpErrorInit = {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds: number | null;
};

export class AlexaSimHttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly retryAfterSeconds: number | null;

  constructor(message: string, init: AlexaSimHttpErrorInit) {
    super(message);
    this.name = "AlexaSimHttpError";
    this.status = init.status;
    this.code = init.code;
    this.retryAfterSeconds = init.retryAfterSeconds;
  }
}

export function parseRetryAfterSeconds(header: string | null): number | null {
  if (header === null || header.trim().length === 0) return null;
  const asNumber = Number(header);
  if (Number.isFinite(asNumber) && asNumber >= 0) return asNumber;
  const asDateMs = Date.parse(header);
  if (!Number.isFinite(asDateMs)) return null;
  return Math.max(0, Math.ceil((asDateMs - Date.now()) / 1_000));
}

export async function postAlexaSimChat(body: {
  sessionId?: string;
  messages: AlexaChatMessage[];
}): Promise<AlexaChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/alexa-sim/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
    throw new AlexaSimHttpError(
      payload?.message ?? `Alexa simulation request failed (${response.status}).`,
      {
        status: response.status,
        code: typeof payload?.error === "string" ? payload.error : `http_${response.status}`,
        retryAfterSeconds: parseRetryAfterSeconds(response.headers.get("Retry-After")),
      },
    );
  }
  return response.json() as Promise<AlexaChatResponse>;
}

export async function getAlexaSimLlmMode(): Promise<"mock" | "live" | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/alexa-sim/health`);
    if (!response.ok) return null;
    const body = await response.json() as { llmMode?: "mock" | "live" };
    return body.llmMode ?? null;
  } catch {
    return null;
  }
}
