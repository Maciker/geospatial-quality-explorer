function tryParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export function extractJson(value) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error("Could not extract valid JSON from empty model output");

  const direct = tryParse(text);
  if (direct !== undefined) return direct;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    const parsed = tryParse(fenced[1].trim());
    if (parsed !== undefined) return parsed;
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const parsed = tryParse(text.slice(firstBrace, lastBrace + 1));
    if (parsed !== undefined) return parsed;
  }

  throw new Error("Could not extract valid JSON from model output");
}
