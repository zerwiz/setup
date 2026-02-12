# zerwiz/setup – Structure

Structure of the **zerwiz/setup** repo. AI Dev Suite tools: Elixir TUI, Electron app, RAG, install scripts.

---

## Repo overview

```
setup/                          # zerwiz/setup – main repo for tools
├── ai-dev-suite/               # Elixir TUI, Electron app, ACP adapter, RAG, install scripts (canonical source)
│   └── rag/                    # Python RAG tool
├── debugger/                   # Debug observer, A2A adapter (observer.sh, start-a2a.sh, a2a-adapter/)
│   └── rag/                    # RAG integration (reads suite rag.log, RAG-style memory)
├── doc/                        # All tool documentation
├── rules/                      # Deployment, GitHub, conventions
├── scripts/                    # Automation scripts
├── setup.sh                    # Workshop setup
├── run-tui.sh                  # AI Dev Suite TUI launcher
├── start-ai-dev-suite-*.sh     # Launchers (api, tui, electron, web, acp)
├── install-ai-dev-suite.sh     # Root install script
├── ensure-rag-deps.sh          # Ensure RAG Python deps
└── README.md
```

---

## ai-dev-suite/

| Path | Purpose |
|------|---------|
| `elixir_tui/` | Elixir TUI (terminal UI): chat, memory, drive, research, install tools. Port 41434 API. |
| `electron_app/` | Desktop app (Electron + React): Chat, Drive, Memory, Tools, Settings, Server. Spawns Elixir API. |
| `acp-adapter/` | ACP adapter for Zed/OpenCode – stdio JSON-RPC to `/api/chat/stream`. |
| `rag/` | Python RAG tool (index, query, research). Used by `/research` and standalone. |
| `install.sh` | Curl-install script (Mac/Linux). |
| `install.ps1` | PowerShell install (Windows). |
| `install-full.sh` | Full install (API, Web, TUI, Electron). |

**Start scripts** (in repo root): `start-ai-dev-suite-api.sh`, `start-ai-dev-suite-tui.sh`, `start-ai-dev-suite-electron.sh`, `start-ai-dev-suite-web.sh`, `start-ai-dev-suite-acp.sh`, `start-ai-dev-suite-debugger.sh` (debugger: API + Ollama + UI).

---

## debugger/

| Path | Purpose |
|------|---------|
| `observer.sh` | Tails API/Ollama logs, health checks, test chat, qwen2.5-coder analysis |
| `start-a2a.sh` | Launches A2A agent (port 41435) |
| `a2a-adapter/` | Node.js A2A server – Agent Card, JSON-RPC, debug-analyzer skill |
| `electron-app/` | Electron UI – status, logs, test chat, analysis (like AI Dev Suite) |

**Usage:** `./debugger/observer.sh`, `./debugger/start-a2a.sh`. Or `DEBUG=1 ./start-ai-dev-suite-electron.sh`.

---

## ai-dev-suite/rag/

Python RAG tool: chunking, hybrid BM25+vector, reranker, incremental index. Used by AI Dev Suite `/research` and standalone.

| Path | Purpose |
|------|---------|
| `rag.py` | Main script: index, query, eval |
| `scripts/load-test.sh` | Load testing |
| `requirements.txt` | Python deps |

## debugger/rag/

RAG integration: debugger reads suite's `rag.log`, has RAG-style memory (`debugger_memory.md`). See [debugger/rag/README.md](../debugger/rag/README.md).

---

## doc/

| Path | Purpose |
|------|---------|
| `ai-dev-suite/` | START, FUNCTIONS, STORAGE, SERVER, LLAMACPP, GITHUB_AGENT, etc. |
| `ai-dev-suite/rag/` | RAG docs, load testing, production hardening |
| `CURL_INSTALLS.md` | All curl commands for homepage (whynotproductions.netlify.app) |
| `STRUCTURE.md` | This file – repo structure |
| `CHANGELOG.md` | Changelog for tools |
---

## Deployment

- **Tools live here (zerwiz/setup).** Develop, commit, push here. Curl URLs point to `raw.githubusercontent.com/zerwiz/setup`.

---

## Quick reference

- **API:** `./start-ai-dev-suite-api.sh` or `cd ai-dev-suite/elixir_tui && mix run -e "AiDevSuiteTui.API.start()"`
- **TUI:** `./start-ai-dev-suite-tui.sh`
- **Electron:** `./start-ai-dev-suite-electron.sh`
- **RAG:** `cd ai-dev-suite/rag && python rag.py …`
