# AI Dev Suite – Debugger

The debugger helps diagnose chat failures like "(no response)", "terminated", and "Cannot reach API". It combines a terminal observer with an A2A (Agent2Agent) agent so you can see what’s happening and let other agents query the debugger for status and analysis.

**→ [DEBUGGER_CAPABILITIES.md](./DEBUGGER_CAPABILITIES.md)** – Full capabilities reference (health, logs, chat, analysis, start services, run fixes, **edit files**, memory, Suite ↔ Debugger).

---

## Overview

| Component       | Purpose |
|----------------|---------|
| **electron-app/** | Electron UI – status cards, log viewer, test chat, qwen2.5-coder analysis |
| **observer.sh**   | Terminal: tails API and Ollama logs, health checks every 10s, test chat, analysis |
| **start-a2a.sh**  | Starts the A2A agent (Google’s Agent2Agent protocol) on port 41435 |
| **a2a-adapter/**  | Node.js A2A server: Agent Card, JSON-RPC endpoint, debug-analyzer skill |

**Location:** `debugger/` at repo root.

---

## Quick start

```bash
# Full debugger (API + Ollama + UI; recommended)
./start-ai-dev-suite-debugger.sh

# Electron UI only
./start-ai-dev-suite-debugger-ui.sh

# Observer (terminal with live logs + health + test chat)
./debugger/observer.sh

# A2A agent (expose debugger to other agents)
./debugger/start-a2a.sh

# Both observer + A2A via main start script
DEBUG=1 ./start-ai-dev-suite-electron.sh
```

---

## Electron UI (`electron-app/`)

Desktop app with the same styling as the AI Dev Suite:

- **Status** – API (41434), Ollama (11434), Vite (5174) with auto-refresh every 10s
- **Logs** – API log + selectable Suite log (Ollama | A2A | RAG | Electron), last 50 lines each
- **Edit file** – Choose file → Read → edit → Write (project root or ~/.config/ai-dev-suite)
- **Test Chat** – Runs a test request to `/api/chat/stream` and shows the output
- **Model selector** – Choose any installed Ollama model for analysis and chat
- **Ask model** – Sends full context (status, logs, processes, files) to the model for analysis

**Run:** `./start-ai-dev-suite-debugger-ui.sh` or `cd debugger/electron-app && npm run dev`

### Chat interface

Use **Chat** in the header to talk to the debugger. Each message automatically includes system context (health, processes, logs, files), so the debugger can answer with full visibility. Multi-turn conversation is supported. Same suggestions-only policy: it will not apply fixes automatically.

### Start, run fixes, edit files

- **Start API / Start Ollama** – When services are down, buttons appear to start them. Output goes to `/tmp/ai-dev-suite-api.log` and `/tmp/ollama.log`.
- **Run fix** – Type a command or use **Choose file** to select a script. Allowed: `ollama`, `mix`, `npm`, `bash`, `sh`. You approve each command before it runs.
- **Edit file** – Choose file → Read → edit in textarea → Write. Paths: project root, `~/.config/ai-dev-suite`. User approves all changes.

### System visibility (processes, terminals, files)

The debugger gathers system context for analysis:

- **Processes** – Relevant processes (ollama, node, beam, elixir, vite, electron) and terminal sessions
- **Files** – Config (`~/.config/ai-dev-suite/`), logs (`/tmp`), project (repo root with ai-dev-suite, debugger, rag)
- **"System" button** – Toggle panel to view processes and files before running analysis

All context is passed to qwen2.5-coder so it can suggest fixes with full visibility. **Suggestions only – no fixes are applied automatically.** You decide which to implement.

### Memory (RAG-style recall)

The debugger remembers every fix it suggests:

- **Storage:** `~/.config/ai-dev-suite/debugger_memory.md`
- **Auto-save:** After each successful analysis, the suggested fix is appended with timestamp, issue summary, and fix text
- **Recall:** Past fixes are injected into the analysis prompt so qwen2.5-coder can reference and reuse prior solutions
- **UI:** Use "Past fixes" in the header to view the full memory

---

## Observer (`observer.sh`)

### What it does

1. **Log tails** – Watches `/tmp/ai-dev-suite-api.log` and `/tmp/ollama.log` with `[API]` and `[OLLAMA]` labels.

2. **Health checks** – Every 10s, reports status of:
   - API (41434)
   - Ollama (11434)
   - Vite (5174)

3. **Test chat** – After ~8s, sends a "hi" request to `/api/chat/stream` and shows the first 20 lines (delta/done/error). Helps spot empty streams.

4. **LLM analysis** – If qwen2.5-coder is available, sends the test output + logs + status to the model and prints suggested fixes.

### When to use

- Chat shows "(no response)" or "terminated"
- "Ollama running" but no replies
- You want to see API/Ollama logs while using the app

### Environment

| Variable     | Default             | Description                    |
|-------------|---------------------|--------------------------------|
| `DEBUG_MODEL` | qwen2.5-coder:3b  | Ollama model used for analysis |

---

## A2A Agent (`start-a2a.sh`, `a2a-adapter/`)

### What it does

Exposes the debugger over **Google’s Agent2Agent (A2A) Protocol**. Other A2A agents can ask for status, logs, and AI-backed analysis.

| Endpoint                         | Purpose            |
|----------------------------------|--------------------|
| `/.well-known/agent-card.json`  | Agent Card (discovery) |
| `/a2a/jsonrpc`                   | JSON-RPC endpoint  |
| `POST /api/analyze`              | Suite "Get debug help" (REST) |

**Skill: debug-analyzer** – Returns API/Ollama status, logs, and optionally LLM analysis when the message contains "analyze" or "suggest".

### When to use

- Another agent or tool needs to query debug state
- Suite "Get debug help" button (A2A starts automatically with Suite)
- You want to automate debugging or integrate with other A2A agents

### Environment

| Variable         | Default                | Description                  |
|------------------|------------------------|------------------------------|
| `DEBUG_A2A_PORT` | 41435                  | HTTP port for the A2A server |
| `DEBUG_A2A_URL`  | http://localhost:PORT  | Public URL (for Agent Card)  |
| `DEBUG_MODEL`    | qwen2.5-coder:3b       | Ollama model for analysis    |

See [A2A_DEBUG.md](./A2A_DEBUG.md) for more detail.

---

## Flow when starting the Suite

Running `./start-ai-dev-suite-electron.sh`:

1. **Ollama** – Started if needed (optionally in a terminal).
2. **API** – Started and readiness is polled.
3. **A2A agent** – Started automatically on port 41435 (enables "Get debug help" in Suite Chat).
4. **Electron** – Started; terminal output teed to `/tmp/ai-dev-suite-electron.log`.

With `DEBUG=1`, a **debug observer** terminal also opens (`debugger/observer.sh`).

---

## Log files

| Log                             | Content                    |
|---------------------------------|----------------------------|
| `/tmp/ai-dev-suite-api.log`     | Elixir API stdout/stderr   |
| `/tmp/ollama.log`               | Ollama stdout/stderr (if started by script) |
| `/tmp/ai-dev-suite-debug-a2a.log` | A2A agent stdout/stderr (starts with Suite) |
| `~/.config/ai-dev-suite/rag.log` | RAG event log |
| `/tmp/ai-dev-suite-electron.log` | Suite terminal (npm, Vite, Electron) when started via script |

---

## Troubleshooting the debugger

### Observer: "No terminal emulator found"

The observer opens logs in a new terminal. If none of `gnome-terminal`, `xterm`, `konsole`, or `xfce4-terminal` is found, it will print that message. Install one of these or run the observer in an existing terminal.

### Observer: qwen2.5-coder "not found"

Analysis requires qwen2.5-coder:

```bash
ollama pull qwen2.5-coder:3b
```

### A2A agent: Port 41435 in use

Set another port:

```bash
DEBUG_A2A_PORT=41436 ./debugger/start-a2a.sh
```

### A2A agent: Build fails

From repo root:

```bash
cd debugger/a2a-adapter
npm install
npm run build
```

---

## Related docs

- [DEBUGGER_CAPABILITIES.md](./DEBUGGER_CAPABILITIES.md) – Full capabilities reference
- [A2A_DEBUG.md](./A2A_DEBUG.md) – A2A protocol details
- [DEBUG_TRACKER.md](./DEBUG_TRACKER.md) – Issues and fixes
- [START.md](./START.md) – Startup and troubleshooting
