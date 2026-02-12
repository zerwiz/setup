# zerwiz/setup – Structure

Structure of the **zerwiz/setup** repo. This repo holds all tools and assets for the WhyNot Productions homepage. The homepage itself is a separate repo (WhyNotProductionsHomepage); we do not work on the homepage here.

---

## Repo overview

```
setup/                          # zerwiz/setup – main repo for tools
├── ai-dev-suite/               # Elixir TUI, Electron app, ACP adapter, install scripts
├── rag/                        # Python RAG tool
├── doc/                        # All tool documentation
├── rules/                      # Deployment, GitHub, conventions
├── for-zerwiz-setup/           # Subset synced to homepage (setup.sh, run-tui.sh, install scripts)
├── scripts/                    # sync-to-homepage.sh
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
| `install.sh` | Curl-install script (Mac/Linux). |
| `install.ps1` | PowerShell install (Windows). |
| `install-full.sh` | Full install (API, Web, TUI, Electron). |

**Start scripts** (in repo root): `start-ai-dev-suite-api.sh`, `start-ai-dev-suite-tui.sh`, `start-ai-dev-suite-electron.sh`, `start-ai-dev-suite-web.sh`, `start-ai-dev-suite-acp.sh`.

---

## rag/

Python RAG tool: chunking, hybrid BM25+vector, reranker, incremental index. Used by AI Dev Suite `/research` and standalone.

| Path | Purpose |
|------|---------|
| `rag.py` | Main script: index, query, eval |
| `scripts/load-test.sh` | Load testing |
| `requirements.txt` | Python deps |

---

## doc/

| Path | Purpose |
|------|---------|
| `ai-dev-suite/` | START, FUNCTIONS, STORAGE, SERVER, LLAMACPP, GITHUB_AGENT, etc. |
| `rag/` | RAG docs, load testing, production hardening |
| `STRUCTURE.md` | This file – repo structure |
| `CHANGELOG.md` | Changelog for tools |
| `SYNC_TO_HOMEPAGE.md` | How to sync for-zerwiz-setup to homepage |

---

## for-zerwiz-setup/

Subset of scripts synced to WhyNotProductionsHomepage `docs/for-zerwiz-setup/`. Run `./scripts/sync-to-homepage.sh` from setup root. Used when the homepage embeds or references these scripts. Canonical source is here in zerwiz/setup.

| Path | Purpose |
|------|---------|
| `setup.sh` | Workshop setup |
| `run-tui.sh` | TUI launcher |
| `ai-dev-suite/install.sh` | Display install commands |
| `ai-dev-suite/install-full.sh` | Full install |
| `ai-dev-suite/README.md` | Brief ai-dev-suite overview |
| `README.md` | Curl commands for homepage use |
| `PUSH_TO_SETUP.md` | Note: we are IN setup; this folder syncs to homepage |

---

## Deployment

- **Tools live here (zerwiz/setup).** Develop, commit, push here. Curl URLs point to `raw.githubusercontent.com/zerwiz/setup`.
- **Homepage:** Netlify hosts WhyNotProductionsHomepage. Tools and assets for the homepage are developed here. A subset (`for-zerwiz-setup/`) is synced to the homepage repo for embedded curl blocks or docs.
- **Sync to homepage:** `./scripts/sync-to-homepage.sh` copies `for-zerwiz-setup/` → `WhyNotProductionsHomepage/docs/for-zerwiz-setup/`. Then commit and push in the homepage repo.

---

## Quick reference

- **API:** `./start-ai-dev-suite-api.sh` or `cd ai-dev-suite/elixir_tui && mix run -e "AiDevSuiteTui.API.start()"`
- **TUI:** `./start-ai-dev-suite-tui.sh`
- **Electron:** `./start-ai-dev-suite-electron.sh`
- **RAG:** `cd rag && python rag.py …`
- **Sync to homepage:** `./scripts/sync-to-homepage.sh`
