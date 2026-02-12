# AI Dev Suite Debugger – Full Capabilities

Complete reference for the debugger’s features, how they work, and how to use them.

---

## Table of Contents

1. [Overview](#overview)
2. [Electron UI Capabilities](#electron-ui-capabilities)
3. [Observer (Terminal)](#observer-terminal)
4. [A2A Agent](#a2a-agent)
5. [Environment Variables](#environment-variables)
6. [Log Files](#log-files)
7. [Related Documentation](#related-documentation)

---

## Overview

The AI Dev Suite Debugger helps diagnose chat failures such as "(no response)", "terminated", and "Cannot reach API". It provides:

| Component | Type | Purpose |
|-----------|------|---------|
| **Electron UI** | Desktop app | Full debug experience: status, logs, chat, analysis, start services, run fixes |
| **observer.sh** | Terminal script | Live log tails, health checks, test chat, LLM analysis |
| **start-a2a.sh** | Script | Starts A2A agent for agent-to-agent queries |
| **a2a-adapter/** | Node.js server | Agent Card, JSON-RPC, debug-analyzer skill |

**Location:** `debugger/` at repo root.

---

## Electron UI Capabilities

### Health Monitoring

| Service | Port | Refresh |
|---------|------|---------|
| API | 41434 | Auto every 10s |
| Ollama | 11434 | Auto every 10s |
| Vite | 5174 | Auto every 10s |

Status cards show up/down with manual **↻ Refresh**.

---

### Logs

| Log | Path | Content |
|-----|------|---------|
| API | `/tmp/ai-dev-suite-api.log` | Elixir API stdout/stderr |
| Ollama | `/tmp/ollama.log` | Ollama stdout/stderr |
| A2A | `/tmp/ai-dev-suite-debug-a2a.log` | A2A agent stdout/stderr (starts with Suite) |
| RAG | `~/.config/ai-dev-suite/rag.log` | RAG event log |
| Electron / terminal | `/tmp/ai-dev-suite-electron.log` | Suite terminal output (npm, Vite, Electron) when started via `start-ai-dev-suite-electron.sh` |

- **Logs** button: Load last 50 lines of each log
- Two panels: API log (fixed) and a selectable Suite log (Ollama | A2A | RAG | Electron)
- All logs are sent to analysis and chat context when available

---

### Suite ↔ Debugger Communication

The Suite and debugger can talk to each other so the debugger can help fix the Suite's problems:

| From | To | How |
|------|-----|-----|
| **Suite** | **Debugger** | "Get debug help" / "Debug help" button in Chat (when error or "(no response)") → Suite calls `/api/debugger/ask` → API proxies to A2A `/api/analyze` → returns LLM fix suggestions |
| **Debugger** | **Suite** | Debugger reads Suite logs (API, Ollama, A2A, RAG, Electron); user runs suggested fixes from debugger UI |

- **A2A adapter** starts automatically with the Suite (`start-ai-dev-suite-electron.sh`) so "Get debug help" works by default
- Suite shows "Open debugger to run fixes →" link after getting suggestions

---

### Test Chat

- Sends a "hi" request to `/api/chat/stream`
- Uses default or first available model and `knowledge_base: default`
- Shows first ~25 lines of stream output
- Helps detect "(no response)", empty streams, API errors

---

### Problem Detection

Automatic detection of:

- API down (port 41434)
- Ollama down (port 11434)
- Vite down (port 5174)
- Error lines in API log (error, exception, crash, failed, panic, timeout, refused)
- Error lines in Ollama log
- Test chat failure or "(no response)"

When problems are detected, a red banner appears with:
- List of detected problems
- **▶ Start API** / **▶ Start Ollama** (when those services are down)
- **Get fix suggestions** (runs LLM analysis)

---

### Start Services

When API or Ollama is down:

| Button | Action | Log |
|--------|--------|-----|
| **▶ Start API** | Runs `start-ai-dev-suite-api.sh` or `mix run` from `ai-dev-suite/elixir_tui` | `/tmp/ai-dev-suite-api.log` |
| **▶ Start Ollama** | Runs `ollama serve` | `/tmp/ollama.log` |

Both run in background; health and logs refresh after starting.

---

### Edit File (Read/Write)

- **Edit file** expandable section: Choose file → Read (load content) → edit in textarea → Write (save)
- Paths allowed: project root, `~/.config/ai-dev-suite`. Cannot write to `/tmp`
- User approves all file changes. Analysis/chat can suggest file path + content for you to apply here

### Run Fix Commands

- Input field for user-approved commands
- **Choose file** button – opens file picker to select a script (`.sh`, `.bash`). Selected path is filled as `bash "/path"`; edit if needed, then Run.
- Allowed commands: `ollama`, `mix`, `npm`, `bash`, `sh`
- Example: `ollama pull qwen2.5-coder:3b`, `mix compile`, or pick a script via Choose file
- Output shown below the input
- **Suggestions only** – no automatic execution

---

### Model selector

- **Dropdown in header** – Lists all Ollama models from `/api/tags`. Choose which model to use for Chat and Analysis. Refreshes with health check.

### LLM Analysis (Ask model)

- Sends full context to the selected Ollama model:
  - Health status
  - Processes (relevant + terminals)
  - Files (config, logs, project)
  - API/Ollama logs
  - Test chat output
- Model returns Problem → Suggestion format
- Includes exact commands when relevant
- Results auto-saved to debugger memory
- Uses `DEBUG_MODEL` if set

---

### Chat Interface

- Multi-turn conversation with the debugger
- Each message includes system context (health, processes, logs, files)
- Model answers using full visibility
- Same suggestions-only policy
- Same model as analysis (qwen2.5-coder by default)

---

### System Visibility

**System** button toggles a panel with:

| Section | Content |
|---------|---------|
| Relevant processes | ollama, node, beam, elixir, vite, electron, mix, erl |
| Terminals | Processes with TTY or common terminal emulators |
| Config & project files | `~/.config/ai-dev-suite/`, logs, repo root (ai-dev-suite, debugger, rag, doc) |

All of this context is sent to the LLM for analysis and chat.

---

### Memory (RAG-style Recall)

- **Storage:** `~/.config/ai-dev-suite/debugger_memory.md`
- **Auto-save:** After each successful analysis, the suggested fix is appended (timestamp, issue summary, fix text)
- **Recall:** Past fixes are injected into the analysis prompt so the model can reuse prior solutions
- **Past fixes** button: View full memory contents

---

### UI Header Buttons

| Button | Action |
|--------|--------|
| ↻ Refresh | Refresh health status |
| Logs | Load API and Ollama logs |
| Past fixes | Toggle memory panel |
| System | Toggle processes/files panel |
| Chat | Toggle chat panel |

---

## Observer (Terminal)

**Script:** `debugger/observer.sh`

### Capabilities

1. **Log tails** – Watches `/tmp/ai-dev-suite-api.log` and `/tmp/ollama.log` with `[API]` and `[OLLAMA]` labels
2. **Health checks** – Every 10s: API (41434), Ollama (11434), Vite (5174)
3. **Test chat** – After ~8s, sends "hi" to `/api/chat/stream`, shows first 20 lines
4. **LLM analysis** – If qwen2.5-coder is available, sends test output + logs + status to the model and prints suggested fixes

### When to use

- Chat shows "(no response)" or "terminated"
- "Ollama running" but no replies
- You want live logs while using the app

---

## A2A Agent

**Script:** `debugger/start-a2a.sh`  
**Adapter:** `debugger/a2a-adapter/`

### Capabilities

Exposes the debugger over **Google’s Agent2Agent (A2A) Protocol**.

| Endpoint | Purpose |
|----------|---------|
| `/.well-known/agent-card.json` | Agent Card (discovery) |
| `/a2a/jsonrpc` | JSON-RPC endpoint |
| `POST /api/analyze` | REST: Suite "Get debug help" – accepts `{ message?, context? }`, returns `{ ok, analysis }` |

**Skill: debug-analyzer** – Returns API/Ollama status, logs, and optionally LLM analysis when the message contains "analyze" or "suggest".

### When to use

- Another agent or tool needs to query debug state
- Automating debugging or integrating with other A2A agents

---

## Environment Variables

| Variable | Default | Scope | Description |
|----------|---------|-------|--------------|
| `DEBUG_MODEL` | qwen2.5-coder:3b | Electron, Observer, A2A | Ollama model for analysis and chat |
| `DEBUG_A2A_PORT` | 41435 | A2A | HTTP port for the A2A server |
| `DEBUG_A2A_URL` | http://localhost:PORT | A2A | Public URL (for Agent Card) |
| `AI_DEV_SUITE_REPO` | (auto-detect) | Electron | Project root path |
| `DEBUGGER_REPO` | (auto-detect) | Electron | Project root path (alternative) |

---

## Log Files

| Log | Content |
|-----|---------|
| `/tmp/ai-dev-suite-api.log` | Elixir API stdout/stderr |
| `/tmp/ollama.log` | Ollama stdout/stderr (if started by script) |
| `/tmp/ai-dev-suite-debug-a2a.log` | A2A agent stdout/stderr (starts with Suite or DEBUG=1) |
| `~/.config/ai-dev-suite/rag.log` | RAG event log |
| `/tmp/ai-dev-suite-electron.log` | Suite terminal output (npm, Vite, Electron) when started via start script |

---

## Design Principles

- **Suggestions only** – No fixes are applied automatically
- **User approval** – You decide which commands to run and which files to write
- **Full visibility** – Processes, terminals, files, and logs are available for analysis
- **File read/write** – Can read and write files under project root or `~/.config/ai-dev-suite` (user approves)
- **Memory** – Past fixes are remembered and reused in future analyses

---

## Related Documentation

- [DEBUGGER.md](./DEBUGGER.md) – Quick start, usage, troubleshooting
- [A2A_DEBUG.md](./A2A_DEBUG.md) – A2A protocol details
- [DEBUG_TRACKER.md](./DEBUG_TRACKER.md) – Issues and fixes log
- [START.md](./START.md) – Startup and troubleshooting
