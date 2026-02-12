# Server Screen

The **Server ↻** screen in the AI Dev Suite is a placeholder for future [llama.cpp](https://github.com/ggerganov/llama.cpp) server integration.

## Purpose

Future integration point for llama.cpp server mode. Run models as local servers, e.g.:

```bash
./server -m model.gguf
# Serves at http://localhost:8080 (OpenAI-compatible API)
```

## Current status

**Integration coming later.**

The screen currently shows a placeholder. When implemented, it will allow you to:

- Start and stop llama.cpp servers
- Configure model path and port
- Use custom GGUF models with the suite (alternative to Ollama)

## Related docs

- [LLAMACPP.md](./LLAMACPP.md) – llama.cpp vs Ollama; server mode details
