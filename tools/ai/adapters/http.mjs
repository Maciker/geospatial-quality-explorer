// Shared POST-JSON plumbing for HTTP-based model adapters: send a JSON body,
// surface non-2xx responses with detail, and parse the JSON payload.
export async function postJson({ url, headers, body, name }) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`${name} request failed: ${response.status} ${response.statusText} ${detail}`.trim());
  }

  return response.json();
}
