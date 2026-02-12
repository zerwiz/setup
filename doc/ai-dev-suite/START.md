# AI Dev Suite – Start Commands

Works on **macOS, Linux, and Windows** (with Git Bash or WSL). Install location and folder structure adapt to your system.

---

## What the system needs

| Requirement | Purpose |
|-------------|---------|
| **localhost:41434** | The Elixir API listens here. The app (Electron, Vite, browser) connects to it. Start the API first or let the Electron app spawn it. |
| **Ollama** (optional) | For Chat: runs models locally. Start with `ollama serve` or use Start Ollama in the app. |
| **Python 3** + pip | For RAG/web research (Internet mode). Installs `duckduckgo-search`, `requests`, `trafilatura` on startup. |
| **Jina API key** (optional) | For higher rate limits when fetching URLs in Internet mode. Set `JINA_API_KEY` when starting the API (e.g. `JINA_API_KEY=your_key ./start-ai-dev-suite-api.sh`). Get a key at [jina.ai](https://jina.ai/). |

**localhost:** Both the API and the UI must be able to reach each other. The API binds to `0.0.0.0` or `127.0.0.1` depending on setup. Use `http://localhost:41434` from the same machine.

---

## Install (curl one-liner)

Install to `~/.local/share/ai-dev-suite` and create launchers in `~/bin`:

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install-full.sh | bash
```

**Install locations** (adapts to your system):
- Code: `~/.local/share/ai-dev-suite` (or `$XDG_DATA_HOME/ai-dev-suite` on Linux)
- Config/data: `~/.config/ai-dev-suite` (memory, drive, knowledge bases)
- Override: `AI_DEV_SUITE_DIR=/path/to/install curl ... | bash`

Then run any launcher:

| Launcher | What it does |
|----------|--------------|
| `ai-dev-suite-api` | API only → http://localhost:41434 |
| `ai-dev-suite-web` | API + browser UI → http://localhost:5174 |
| `ai-dev-suite-tui` | Terminal menu |
| `ai-dev-suite-electron` | Desktop app |

---

## Zed & OpenCode (ACP)

Use the AI Dev Suite as an ACP agent in Zed or OpenCode. **Prerequisite:** API running at http://localhost:41434 (Electron app or `ai-dev-suite-api`).

**Build the adapter:**
```bash
cd ~/.local/share/ai-dev-suite/acp-adapter   # or ai-dev-suite/acp-adapter from repo
npm install && npm run build
```

**Zed config** – add to `~/.config/zed/settings.json`:
```json
{
  "agent_servers": {
    "AI Dev Suite": {
      "command": "node",
      "args": ["/home/YOUR_USER/.local/share/ai-dev-suite/acp-adapter/dist/index.js"]
    }
  }
}
```
Replace the path with your actual install path. Then: **Command Palette** → `agent: new thread` → select "AI Dev Suite".

**OpenCode:** See [ZED_OPENCODE_ACP.md](./ZED_OPENCODE_ACP.md) §7. OpenCode ACP docs currently describe OpenCode as the agent; no published config yet for OpenCode as client connecting to external agents. Use Zed or JetBrains today.

---

## Quick run (no install)

**TUI only** (downloads and runs; needs Elixir):

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-tui.sh | bash
```

---

## Scripts from repo

If you have zerwiz/setup cloned:

| Script | What it does |
|--------|--------------|
| `./start-ai-dev-suite-api.sh` | API only → http://localhost:41434 |
| `./start-ai-dev-suite-web.sh` | API + Vite → http://localhost:5174 |
| `./start-ai-dev-suite-electron.sh` | Electron desktop app |
| `./start-ai-dev-suite-tui.sh` | TUI (terminal menu) |
| `./start-ai-dev-suite-acp.sh` | ACP adapter (stdio, for Zed/OpenCode) |

**On startup**, all scripts: start Ollama if not running, run `ensure-rag-deps.sh` for RAG/web research deps (duckduckgo-search, trafilatura, etc.) for Internet mode in Chat.

If `./script.sh` says "Permission denied", run `bash ./script.sh` or `chmod +x *.sh` first.

```bash
cd ~/CodeP/setup
./start-ai-dev-suite-web.sh       # browser UI
./start-ai-dev-suite-electron.sh  # desktop app (npm install first in electron_app)
```

---

## Manual (two terminals) – when start script fails

If `./start-ai-dev-suite-electron.sh` gives "Cannot reach API" or "(no response)", run the API first in its own terminal (so you see logs), then the app:

**Terminal 1 – API (keep this running)**
```bash
cd ~/CodeP/setup
./start-ai-dev-suite-api.sh
```
Wait for "Zerwiz AI Dev Suite API running at http://localhost:41434".

**Terminal 2 – Electron (do not use the full start script; it would restart the API)**
```bash
cd ~/CodeP/setup/ai-dev-suite/electron_app
AI_DEV_SUITE_API_STARTED=1 npm run dev
```

Or for browser only:
```bash
cd ~/CodeP/setup
./start-ai-dev-suite-web.sh
```
(Web script starts its own API; use this if you skipped Terminal 1.)

---

## Troubleshooting: "(no response)" in Chat

If Chat shows "(no response)" when you send a message, check these in order:

### 1. Try KB: default

Large knowledge bases can cause empty replies. Click **KBs** and switch to **default**. If chat works with default KB, your custom KB may be too large or have problematic content.

### 2. Run the API in a visible terminal

API and Ollama errors appear in the terminal. Run the Electron app from a terminal, or start the API separately.

**No Ollama terminal opens?** The script only opens one when it starts Ollama. If Ollama is already running, use `OLLAMA_TERMINAL=1 ./start-ai-dev-suite-electron.sh` or see [OLLAMA_TERMINAL.md](./OLLAMA_TERMINAL.md).

**Debug observer:** `DEBUG=1 ./start-ai-dev-suite-electron.sh` opens a second terminal (logs, health checks, test chat) and starts the **A2A debug agent** (Google Agent2Agent protocol) at http://localhost:41435 so other agents can query it. Or run manually: `./debugger/observer.sh`, `./debugger/start-a2a.sh`. See [A2A_DEBUG.md](./A2A_DEBUG.md).

```bash
./start-ai-dev-suite-api.sh
```

Or: `./start-ai-dev-suite-electron.sh` – API logs go to that same terminal.

### 3. Ollama running?

Click **Refresh** in Chat. If "Ollama not running": Start Ollama button or `ollama serve` in a terminal.

### 4. First model load

The first time you use a model (e.g. llama3.1), Ollama loads it into memory. Can take 1–2 minutes. Wait and try again.

### 5. Ports in use

- **41434** (API) – Another API/Electron instance may be running. Stop it, then restart.
- **5174** (Vite) – Stale dev server. Start scripts free it automatically; or `kill $(lsof -t -i:5174)`.

### 6. API reachable?

```bash
curl -s http://localhost:41434/api/ollama/models
```

If this fails: API not running or wrong port. Start the API first.

### 7. Ollama responding?

```bash
curl -s http://localhost:11434/api/tags
```

If this fails: Ollama not running. Start with `ollama serve`.

### 8. Model exists?

```bash
ollama list
```

If your model is missing: pull it (`ollama pull llama3.1` or use ↓ Download in Chat).

### 9. Direct Ollama chat works?

```bash
ollama run llama3.1:latest "hello"
```

If this hangs or errors: fix Ollama (e.g. GPU drivers, disk space) before using Chat.

### 10. Knowledge base / system prompt

Very large or malformed docs in the KB can cause slow or empty responses. Try KB: **default** (minimal drive) to rule it out.

### 11. Firewall / VPN

Localhost (127.0.0.1) is usually allowed. If you use a VPN or strict firewall, ensure it doesn’t block local connections.

### 12. Elixir / Mix

If the API won’t start: `cd ai-dev-suite/elixir_tui && mix deps.get && mix compile`. Check for compile errors.

### 13. Timeout

First model load can exceed 30s. Chat allows up to ~5 min. If you see a timeout error, the model may be too large for your hardware.
