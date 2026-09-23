import { extractJson } from "../../lib/json.mjs";
import { postJson } from "./http.mjs";

function splitMessages(request) {
  if (Array.isArray(request.messages)) {
    const system = request.messages.find((message) => message.role === "system")?.content ?? request.system;
    const rest = request.messages.filter((message) => message.role !== "system");
    return { system, messages: rest };
  }
  return {
    system: request.system,
    messages: request.prompt ? [{ role: "user", content: request.prompt }] : [],
  };
}

function mapTools(tools) {
  if (!tools?.length) return undefined;
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters ?? { type: "object" },
  }));
}

export function createAnthropicAdapter(config) {
  const baseUrl = (config.baseUrl ?? "https://api.anthropic.com").replace(/\/$/, "");

  return {
    name: config.providerName ?? "anthropic",
    async complete(request) {
      if (typeof fetch !== "function") {
        throw new Error("global fetch is not available; Node 18+ is required for the AI client");
      }

      const { system, messages } = splitMessages(request);
      const jsonInstruction = request.responseSchema
        ? "\n\nRespond with a single JSON object only. No prose, no Markdown, no code fences."
        : "";

      const body = {
        model: request.model ?? config.model,
        max_tokens: request.maxTokens ?? config.maxTokens ?? 4096,
        temperature: request.temperature ?? config.temperature ?? 0.2,
        ...(system ? { system: `${system}${jsonInstruction}` } : jsonInstruction ? { system: jsonInstruction.trim() } : {}),
        messages,
        ...(mapTools(request.tools) ? { tools: mapTools(request.tools) } : {}),
        ...(config.extraBody ?? {}),
      };

      const payload = await postJson({
        url: `${baseUrl}/v1/messages`,
        headers: {
          "anthropic-version": config.anthropicVersion ?? "2023-06-01",
          ...(config.apiKey ? { "x-api-key": config.apiKey } : {}),
          ...(config.headers ?? {}),
        },
        body,
        name: this.name,
      });
      const text = (payload.content ?? [])
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("");
      const toolCalls = (payload.content ?? [])
        .filter((block) => block.type === "tool_use")
        .map((block) => ({ id: block.id, name: block.name, arguments: JSON.stringify(block.input ?? {}) }));

      return {
        text,
        json: request.responseSchema ? extractJson(text) : undefined,
        toolCalls,
        usage: payload.usage,
        raw: payload,
      };
    },
  };
}
