# Tools Structure

Structure of the **`tools/`** folder – AI Dev Suite, RAG, and tool docs.

---

## tools/ overview

```
tools/
├── ai-dev-suite/          # Elixir TUI, Electron app, ACP adapter, install scripts
├── doc/                   # Documentation (this folder)
├── rag/                   # Python RAG tool
├── install-ai-dev-suite.sh
├── start-ai-dev-suite-*.sh
├── ensure-rag-deps.sh
└── README.md              → synced to zerwiz/setup as TOOLS_README.md
```

---

## tools/ai-dev-suite/

| Path | Purpose |
|------|---------|
| `elixir_tui/` | Elixir TUI (terminal UI): chat, memory, drive, research, install tools. Port 41434 API. |
| `electron_app/` | Desktop app (Electron + React): Chat, Drive, Memory, Tools, Settings, Server. Spawns Elixir API. |
| `acp-adapter/` | ACP adapter for Zed/OpenCode – stdio JSON-RPC to `/api/chat/stream`. |
| `install.sh` | Curl-install script (Mac/Linux). |
| `install.ps1` | PowerShell install (Windows). |

**Start scripts** (in `tools/`): `start-ai-dev-suite-api.sh`, `start-ai-dev-suite-tui.sh`, `start-ai-dev-suite-electron.sh`, `start-ai-dev-suite-web.sh`.

---

## tools/rag/

Python RAG tool: chunking, hybrid BM25+vector, reranker, incremental index. Used by AI Dev Suite `/research` and standalone.

| Path | Purpose |
|------|---------|
| `rag.py` | Main script: index, query, eval |
| `scripts/load-test.sh` | Load testing |
| `requirements.txt` | Python deps |

---

## tools/doc/ (this folder)

| Path | Purpose |
|------|---------|
| `ai-dev-suite/` | START, FUNCTIONS, STORAGE, SERVER, LLAMACPP, GITHUB_AGENT, etc. |
| `rag/` | RAG docs, load testing, production hardening |
| `TODO.md` | Consolidated todo list |
| `README.md` | Tools doc index |
| `STRUCTURE.md` | This file – tools folder structure |

---

## tools/ (root-level)

| Path | Purpose |
|------|---------|
| `install-ai-dev-suite.sh` | Root install script (synced to zerwiz/setup). |
| `start-ai-dev-suite-*.sh` | Launchers for API, TUI, Electron, web. |
| `ensure-rag-deps.sh` | Ensure RAG Python deps (pip install). |
| `README.md` | Tools overview → pushed to setup as `TOOLS_README.md`. |

---

## Deployment to zerwiz/setup

`tools/` is synced to [zerwiz/setup](https://github.com/zerwiz/setup) via `./scripts/push-to-setup.sh` (run from repo root).

| In zerwiz/setup | From |
|-----------------|------|
| ai-dev-suite/ | tools/ai-dev-suite/ |
| doc/ | tools/doc/ |
| rag/ | tools/rag/ |
| install-ai-dev-suite.sh, start-ai-dev-suite-*.sh | tools/ |
| TOOLS_README.md | tools/README.md |

---

## Quick reference

- **API:** `./start-ai-dev-suite-api.sh` or `cd ai-dev-suite/elixir_tui && mix run -e "AiDevSuiteTui.API.start()"`
- **TUI:** `./start-ai-dev-suite-tui.sh`
- **Electron:** `./start-ai-dev-suite-electron.sh`
- **RAG:** `cd rag && python rag.py …`
- **Push to setup:** `./scripts/push-to-setup.sh` (from repo root)
