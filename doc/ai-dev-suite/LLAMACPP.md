# llama.cpp and the AI Dev Suite

## What is llama.cpp?

[llama.cpp](https://github.com/ggerganov/llama.cpp) is a C++ implementation of LLaMA model inference. It runs large language models locally with minimal dependencies and good performance, especially on CPU and Apple Silicon.

**Highlights:**
- Runs GGUF/GGML model files
- No GPU required (CPU inference)
- Optimized for Apple M1/M2/M3
- Supports many models (Llama, Mistral, Qwen, etc.)

## How the AI Dev Suite Uses It

The AI Dev Suite does **not** call llama.cpp directly. It uses **[Ollama](https://ollama.com)**, which:

- Exposes a simple HTTP API (`http://localhost:11434`)
- Manages model download, storage, and serving
- Uses llama.cpp (and other backends) under the hood for many models
- Provides a unified interface regardless of backend

So when you chat in the AI Dev Suite, the flow is:

```
AI Dev Suite → Ollama API → Ollama backend → llama.cpp (for many models)
```

## When Ollama Uses llama.cpp

Ollama uses llama.cpp for GGUF-based models. Most popular models (Llama, Mistral, Qwen, Phi, etc.) are served this way. You don't need to install or configure llama.cpp yourself—Ollama handles it.

## Using llama.cpp Directly

If you want to run llama.cpp without Ollama (e.g. for custom GGUF files or fine-grained control):

### Build and run
```bash
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make   # or cmake for GPU builds
./main -m your-model.gguf -p "Your prompt"
```

### Server mode (OpenAI-compatible API)
```bash
./server -m your-model.gguf
# Serves at http://localhost:8080
```

The AI Dev Suite does not integrate with llama.cpp's server mode. To use your own models with the suite, use **Ollama** and create a [custom Modelfile](https://github.com/ollama/ollama/blob/main/docs/modelfile.md) that references your GGUF file.

## Summary

| Tool       | AI Dev Suite support | Use case                          |
|-----------|-----------------------|-----------------------------------|
| **Ollama** | ✅ Yes (primary)      | Chat, models, simple setup        |
| **llama.cpp** | ❌ No (indirect via Ollama) | Low-level control, custom builds |

For the AI Dev Suite, install and use **Ollama**. It provides the models the suite needs, and uses llama.cpp internally where appropriate.

---

## localhost and API keys

**localhost:** The suite runs locally. The Elixir API listens on `http://localhost:41434`. The Electron app, web UI, or any client connects to that address. Both must run on the same machine (or ensure the API is reachable if you bind to a different host).

**API keys:**
- **Jina API key (optional)** – For higher rate limits when fetching URLs in Internet mode. Set `JINA_API_KEY` when starting the API (e.g. `JINA_API_KEY=your_key ./start-ai-dev-suite-api.sh`). Get a key at [jina.ai](https://jina.ai/).
- **OpenAI API key (optional)** – For cloud models when that option is available, set `OPENAI_API_KEY`. The suite currently uses Ollama (local, no API key).
