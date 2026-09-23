import { extractJson } from "../../lib/json.mjs";
import { postJson } from "./http.mjs";

function toMessages(request) {
  if (Array.isArray(request.messages)) return request.messages;
  const messages = [];
  if (request.system) messages.push({ role: "system", content: request.system });
  if (request.prompt) messages.push({ role: "user", content: request.prompt });
  return messages;
}

function buildResponseFormat(responseSchema) {
  if (!responseSchema) return undefined;
  return {
    type: "json_schema",
    json_schema: {
      name: responseSchema.name ?? "structured_output",
      schema: responseSchema.schema ?? responseSchema,
      strict: responseSchema.strict ?? true,
    },
  };
}

function mapTools(tools) {
  if (!tools?.length) return undefined;
  return tools.map((tool) => ({
    type: "function",
    function: { name: tool.name, description: tool.description, parameters: tool.parameters ?? { type: "object" } },
  }));
}

export function createOpenAICompatAdapter(config) {
  const baseUrl = (config.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");

  return {
    name: config.providerName ?? "openai-compat",
    async complete(request) {
      if (typeof fetch !== "function") {
        throw new Error("global fetch is not available; Node 18+ is required for the AI client");
      }

      const responseFormat =
        buildResponseFormat(request.responseSchema) ?? (request.jsonObjectMode ? { type: "json_object" } : undefined);
      const wantsJson = Boolean(request.responseSchema || request.jsonObjectMode);

      const body = {
        model: request.model ?? config.model,
        messages: toMessages(request),
        temperature: request.temperature ?? config.temperature ?? 0.2,
        ...(request.maxTokens ?? config.maxTokens ? { max_tokens: request.maxTokens ?? config.maxTokens } : {}),
        ...(responseFormat ? { response_format: responseFormat } : {}),
        ...(mapTools(request.tools) ? { tools: mapTools(request.tools), tool_choice: request.toolChoice ?? "auto" } : {}),
        ...(config.extraBody ?? {}),
        ...(request.extraBody ?? {}),
      };

      const payload = await postJson({
        url: `${baseUrl}/chat/completions`,
        headers: {
          ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
          ...(config.headers ?? {}),
        },
        body,
        name: this.name,
      });
      const choice = payload.choices?.[0];
      const text = choice?.message?.content ?? "";
      const toolCalls = (choice?.message?.tool_calls ?? []).map((call) => ({
        id: call.id,
        name: call.function?.name,
        arguments: call.function?.arguments,
      }));

      return {
        text,
        json: wantsJson && text ? extractJson(text) : undefined,
        toolCalls,
        usage: payload.usage,
        raw: payload,
      };
    },
  };
}
