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
cd ~/.local/share/ai-dev-suite/acp-adapter   # or tools/ai-dev-suite/acp-adapter from repo
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

## Scripts from repo (from `tools/`)

If you have the WhyNotProductions Homepage repo cloned:

| Script | What it does |
|--------|--------------|
| `./start-ai-dev-suite-api.sh` | API only → http://localhost:41434 |
| `./start-ai-dev-suite-web.sh` | API + Vite → http://localhost:5174 |
| `./start-ai-dev-suite-electron.sh` | Electron desktop app |
| `./start-ai-dev-suite-tui.sh` | TUI (terminal menu) |
| `./start-ai-dev-suite-acp.sh` | ACP adapter (stdio, for Zed/OpenCode) |

**On startup**, all scripts run `ensure-rag-deps.sh` to install RAG/web research deps (duckduckgo-search, trafilatura, etc.) for Internet mode in Chat.

```bash
cd ~/CodeP/WhyNotProductions\ Homepage/tools
./start-ai-dev-suite-web.sh       # browser UI
./start-ai-dev-suite-electron.sh  # desktop app (npm install first in electron_app)
```

---

## Manual (two terminals)

**Terminal 1 – API**
```bash
cd ~/CodeP/WhyNotProductions\ Homepage/tools/ai-dev-suite/elixir_tui
mix run -e "AiDevSuiteTui.API.start()"
```

**Terminal 2 – React**
```bash
cd ~/CodeP/WhyNotProductions\ Homepage/tools/ai-dev-suite/electron_app
npm run dev:vite
```

Open http://localhost:5174. API: http://localhost:41434.
