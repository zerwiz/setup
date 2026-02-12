# Debug Observer – A2A (Agent2Agent) Protocol

The debug observer exposes itself via **Google's Agent2Agent (A2A) Protocol**, enabling other AI agents to query it for status, logs, and debugging advice.

## What is A2A?

[Agent2Agent (A2A)](https://google.github.io/A2A/) is an open standard (by Google, now in the Linux Foundation) for agent-to-agent communication. It provides:

- **Discovery** – Agent Cards describe capabilities and endpoints
- **JSON-RPC over HTTP** – Standard request/response format
- **Streaming** – Optional SSE for real-time updates
- **Interoperability** – Agents from different frameworks can collaborate

## Debug A2A Agent

The **A2A debug agent** starts automatically when you run the Suite (`./start-ai-dev-suite-electron.sh`) or with `DEBUG=1`. It runs at http://localhost:41435.

| Endpoint | Purpose |
|----------|---------|
| `/.well-known/agent-card.json` | Agent Card (discovery) |
| `/a2a/jsonrpc` | JSON-RPC endpoint |
| `POST /api/analyze` | REST endpoint for Suite "Get debug help" – accepts `{ message?, context? }`, returns `{ ok, analysis }` |

**Skill: debug-analyzer** – Returns API/Ollama status, recent logs, and optionally LLM analysis (qwen2.5-coder) when you send "analyze" or "suggest".

## Manual start

```bash
./debugger/start-a2a.sh
```

## Query from another agent

Any A2A-compatible client can send a message:

```bash
# Example with curl (simplified – full A2A uses JSON-RPC)
curl -s http://localhost:41435/.well-known/agent-card.json
```

Use the [A2A JS SDK](https://github.com/a2aproject/a2a-js) or [A2A Python SDK](https://github.com/a2aproject/a2a-python) to create a client that calls `sendMessage` with your debug query.

## Environment

- `DEBUG_A2A_PORT` – Port (default 41435)
- `DEBUG_MODEL` – Ollama model for analysis (default qwen2.5-coder:3b)

## See also

- [debugger/a2a-adapter README](../../debugger/a2a-adapter/README.md)
- [A2A Protocol specification](https://google.github.io/A2A/specification/)
