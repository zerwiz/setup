# AI Dev Suite – Debugger

Debug tools for the AI Dev Suite: observer (logs, health checks, test chat), A2A adapter, and **Electron UI**. The debugger can read/write files and communicate with the Suite so you can fix problems end-to-end.

## Contents

| Path | Purpose |
|------|---------|
| `observer.sh` | Tails API + Ollama logs, health checks every 10s, test chat, LLM analysis |
| `start-a2a.sh` | Launches A2A agent (http://localhost:41435) for Suite "Get debug help" and agent-to-agent queries |
| `a2a-adapter/` | Node.js A2A server – Agent Card, JSON-RPC, `POST /api/analyze` (Suite) |
| `electron-app/` | Electron UI – status, logs, **edit files**, test chat, analysis, chat, run fixes |

## Quick start

```bash
# Full debugger (API + Ollama + UI; recommended)
./start-ai-dev-suite-debugger.sh

# Electron UI only
./start-ai-dev-suite-debugger.sh

# Observer (terminal)
./debugger/observer.sh

# A2A agent only (also starts automatically with Suite)
./debugger/start-a2a.sh

# Suite + A2A (enables "Get debug help" in Chat); add DEBUG=1 for observer terminal
./start-ai-dev-suite-electron.sh
```

## Suite ↔ Debugger

- **Suite → Debugger:** "Get debug help" / "Debug help" in Chat (when error or "(no response)") fetches fix suggestions from the A2A agent.
- **Debugger → Suite:** Reads Suite logs (API, Ollama, A2A, RAG, Electron); user runs suggested fixes (commands or file edits).

A2A starts automatically when you run the Suite.

## See also

- [DEBUGGER_CAPABILITIES.md](../doc/ai-dev-suite/DEBUGGER_CAPABILITIES.md) – Full capabilities reference
- [DEBUGGER.md](../doc/ai-dev-suite/DEBUGGER.md) – Quick start and usage
- [A2A_DEBUG.md](../doc/ai-dev-suite/A2A_DEBUG.md) – A2A protocol details
- [a2a-adapter/README.md](./a2a-adapter/README.md) – A2A adapter reference
