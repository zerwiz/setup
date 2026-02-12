# Server Screen

The **Server ↻** screen in the AI Dev Suite manages [llama.cpp](https://github.com/ggerganov/llama.cpp) server processes as an alternative to Ollama.

## Purpose

Run GGUF models as local OpenAI-compatible servers, e.g.:

```bash
./server -m model.gguf --port 8080
# Serves at http://localhost:8080 (OpenAI-compatible API)
```

## Features

- **Start / Stop** – Launch and stop the llama.cpp server process
- **Configure** – Model path (required), port (default 8080), optional server binary path
- **Status** – Shows running state, port, and current model path
- **Config storage** – `~/.config/ai-dev-suite/server_config.json`

The server binary is auto-detected when `server_path` is empty:

- `server` in PATH
- `~/llama.cpp/build/bin/server`
- `~/llama.cpp/server`
- `/usr/local/bin/llama-server`
- `/usr/local/bin/server`

## API

- `GET /api/server/status` – running, port, model_path, server_path
- `GET /api/server/config` – current config
- `PUT /api/server/config` – save config (model_path, port, server_path)
- `POST /api/server/start` – start server
- `POST /api/server/stop` – stop server

## Related docs

- [LLAMACPP.md](./LLAMACPP.md) – llama.cpp vs Ollama; server mode details
