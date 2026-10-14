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
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message ?? `Alexa simulation request failed (${response.status}).`);
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
