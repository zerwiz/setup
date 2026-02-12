# AI Dev Suite – Thinking (Extended Reasoning)

How thinking tokens work in LLMs, and how to use them correctly with Ollama and the AI Dev Suite.

---

## Overview

**Extended thinking** (also called reasoning tokens, chain-of-thought, or deliberate reasoning) lets some LLMs generate an internal reasoning trace before their final answer. The trace is exposed as a separate `thinking` field in the API, so you can:

- Show the model “thinking” in the UI
- Debug or audit its steps
- Ignore it and only show the final answer

**Important:** Only specific models support this. Sending `think: true` to non‑thinking models (e.g. qwen2.5-coder, llama3.1) can lead to empty responses or unexpected behavior.

---

## Supported Models (Ollama)

As of Ollama’s docs (https://docs.ollama.com/capabilities/thinking):

| Model | Think parameter | Notes |
|-------|-----------------|------|
| **Qwen 3** | `true` / `false` | Standard boolean |
| **DeepSeek R1** | `true` / `false` | Standard boolean |
| **DeepSeek-v3.1** | `true` / `false` | Standard boolean |
| **GPT-OSS** | `"low"` / `"medium"` / `"high"` | Uses levels, not boolean; trace cannot be fully disabled |

Browse thinking models: https://ollama.com/search?c=thinking

### Models that do NOT support thinking

- **qwen2.5-coder** – Qwen 2.5, not Qwen 3; no thinking capability
- **llama3.1**, **llama3.2** – No thinking
- **mistral**, **mixtral**, **codellama** – No thinking

---

## API Usage

### Enable thinking in a chat request

```json
{
  "model": "qwen3",
  "messages": [{"role": "user", "content": "How many letter r are in strawberry?"}],
  "think": true,
  "stream": true
}
```

### Response format

- **Non‑streaming:**  
  - `message.thinking` – reasoning trace  
  - `message.content` – final answer  

- **Streaming:**  
  - Chunks can contain `message.thinking` and/or `message.content`  
  - Reasoning tokens usually appear before answer tokens  
  - Treat the first `thinking` chunk as the start of the “thinking” section  
  - Start showing the final reply when `content` arrives  

### GPT-OSS-specific behavior

GPT-OSS expects a level string:

```json
{"think": "medium"}
```

`true` / `false` are ignored for GPT-OSS.

---

## Streaming Behavior

1. **Order:** Thinking tokens tend to stream before content tokens.
2. **Interleaving:** In principle, thinking and content can be interleaved.
3. **UI pattern:** Detect the first `thinking` chunk to open a “Thinking” section; when `content` starts, switch to the final answer.
4. **Hide trace:** To use a thinking model without showing the trace, use `--hidethinking` (CLI) or parse `content` only (API).

---

## Best Practices

### When to use thinking

- Hard math or logic problems
- Multi-step debugging (e.g. race conditions)
- Architecture and design choices with trade-offs
- Security or performance analysis
- Any task that benefits from explicit reasoning

### When to avoid thinking

- Simple questions
- Straightforward code generation or refactoring
- Short, direct answers
- Cases where speed matters more than depth

### Implementation rules

1. **Only send `think: true` for supported models.** Check the model name before adding it.
2. **Use allowlists, not denylists.** Prefer a short list of known thinking models.
3. **Handle both thinking and content** in stream parsing; never assume only one is present.
4. **Default to `think: false`** when the model is unknown.
5. **GPT-OSS:** Use `"low"` / `"medium"` / `"high"` instead of a boolean.

---

## AI Dev Suite Integration

### Current status

Thinking is **disabled** in the AI Dev Suite backend because sending `think: true` to non‑thinking models (e.g. qwen2.5-coder) caused “(no response)” issues.

### Re-enabling thinking (for supported models)

To turn thinking back on only for supported models, add logic like this in `build_ollama_body`:

```elixir
defp model_supports_thinking?(model) when is_binary(model) do
  m = String.downcase(model)
  String.contains?(m, "qwen3") or
  String.contains?(m, "deepseek-r1") or
  String.contains?(m, "deepseek-v3") or
  String.contains?(m, "gpt-oss")
end
```

Then:

```elixir
base = if stream and model_supports_thinking?(model),
  do: Map.put(base, "think", true),
  else: base
```

For GPT-OSS, use `"think" => "medium"` (or `"low"` / `"high"`) instead of `true`.

### Frontend

- The chat UI already supports `thinking` on messages (optional `thinking` field).
- The stream API already sends `{thinking: "..."}` chunks.
- `onThinking` and `appendThinkingToLastAssistantMessage` exist in the frontend.
- To fully use thinking again, re-enable it in the backend with the model check above.

---

## References

- [Ollama – Thinking](https://docs.ollama.com/capabilities/thinking)
- [Ollama – Thinking models](https://ollama.com/search?c=thinking)
- [Anthropic – Extended thinking tips](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/extended-thinking-tips)
- [DeepSeek-R1 paper](https://arxiv.org/abs/2504.07128)
