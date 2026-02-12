/**
 * HTTP client for AI Dev Suite API (Elixir, port 41434).
 * Used by the ACP adapter to proxy chat requests.
 */

const DEFAULT_API_URL =
  process.env.AI_DEV_SUITE_API_URL || "http://localhost:41434";
const DEFAULT_MODEL =
  process.env.AI_DEV_SUITE_MODEL || "llama3.2:latest";

export function getApiUrl(): string {
  return DEFAULT_API_URL;
}

export function getDefaultModel(): string {
  return DEFAULT_MODEL;
}

/** Check if the API is reachable */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${DEFAULT_API_URL}/api/tools`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Build messages array from ACP prompt content blocks */
export function promptBlocksToMessages(
  content: Array<{ type: string; text?: string | null }>
): Array<{ role: string; content: string }> {
  const parts: string[] = [];
  for (const block of content) {
    if (block.type === "text" && typeof block.text === "string") {
      parts.push(block.text);
    }
  }
  const contentStr = parts.join("\n\n").trim();
  if (!contentStr) return [];
  return [{ role: "user", content: contentStr }];
}

/** Stream chat from API – yields { delta } or { done } or { error } */
export async function* streamChat(
  model: string,
  messages: Array<{ role: string; content: string }>,
  knowledgeBases: string[] = ["default"],
  abortSignal?: AbortSignal
): AsyncGenerator<
  { delta?: string; done?: boolean; error?: string },
  void,
  unknown
> {
  const url = `${DEFAULT_API_URL}/api/chat/stream`;
  const body = JSON.stringify({
    model: model || DEFAULT_MODEL,
    messages,
    knowledge_bases: knowledgeBases,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: abortSignal,
  });

  if (!res.ok) {
    const text = await res.text();
    yield { error: `API error ${res.status}: ${text.slice(0, 200)}` };
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    yield { error: "No response body" };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const obj = JSON.parse(trimmed);
          if (obj.delta) yield { delta: obj.delta };
          if (obj.done) yield { done: true };
          if (obj.error) yield { error: obj.error };
        } catch {
          // skip malformed lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
