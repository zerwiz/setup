# Zerwiz AI Dev Suite – Electron Desktop App

Hello and welcome to the **Zerwiz AI Dev Suite** desktop app. This is a standalone GUI for AI dev tools: install Zed, OpenCode, Ollama, LM Studio, OpenClaw, Workshop Setup; chat with Ollama; manage memory, drive, and knowledge bases. Uses the Elixir backend API and an Electron + React frontend. Styled with the WhyNot Productions look.

- **Home page:** [whynotproductions.netlify.app](https://whynotproductions.netlify.app)
- **Full documentation:** [doc/ai-dev-suite/](../../doc/ai-dev-suite/)

## Header

- **Zerwiz AI Dev Suite** – App title
- **Ollama status** – Green dot when running, red when not (with Refresh / Start Ollama)
- **Quit** – Saves workspace (chats to localStorage, conversation facts to memory) and exits
- **Nav** – Home, Chat, Drive, Memory, Tools, Settings, Server ↻

## Screens

| Screen | Purpose |
|--------|---------|
| **Home** | Models list, Ollama status, config dir |
| **Tools** | Install Zed, OpenCode, Ollama, LM Studio, OpenClaw, Workshop Setup |
| **Chat** | Ollama chat with model picker, KB selector, **Internet** button (web search), Upload doc, Download model. Slash commands: `/memory` `/remember` `/drive` `/research` `/bye` |
| **Drive** | List and add documents for AI context. **Browse files & folders** button picks local files/folders; path input accepts file/folder paths or URLs |
| **Memory** | Manual + conversation memory; add notes with /remember |
| **Settings** | Config directory (memory, behavior, drive, knowledge bases). **Browse** opens folder in file manager; **Select folder…** picks a different path; **Save** to apply (restart required). Override via `AI_DEV_SUITE_CONFIG_DIR`. |
| **Server ↻** | Placeholder for future llama.cpp server integration. See [LLAMACPP.md](../../doc/ai-dev-suite/LLAMACPP.md). |

## Chat

- **+ New chat** – Create session; chats auto-save to localStorage
- **Rename** – Double-click a tab or use Rename button
- **Model** – Select Ollama model (e.g. `llama3.1:latest`)
- **KB** – Documents the AI sees (default = general drive; custom KBs = project-specific). Each chat can use a different KB—work on multiple projects. Create KBs in Drive.
- **Internet** – Toggle ON before sending to enable web search for that message. URLs in your message are fetched (via Jina Reader). AI will say if it could reach the internet.
- **Slash commands** – `/memory` `/remember` `/drive` `/research` `/bye` (use `/bye` in chat to save conversation facts before quitting)
- **Quit** – Click header Quit to save everything and exit

## Prerequisites

- **Node.js** 18+
- **Elixir** + **Mix** (for the API backend)
- **Ollama** (optional, for chat)

## System requirements

| Requirement | Purpose |
|-------------|---------|
| **localhost:41434** | The app talks to the Elixir API at `http://localhost:41434`. The Electron app spawns the API automatically, or you can start it manually with `./start-ai-dev-suite-api.sh`. |
| **Python 3** | For Internet/web search (RAG). Deps install on startup. |
| **Jina API key** (optional) | For higher rate limits when fetching URLs. Set `JINA_API_KEY` when starting the API (e.g. `JINA_API_KEY=your_key ./start-ai-dev-suite-api.sh`). Get a key at [jina.ai](https://jina.ai/). |

## Quick start

1. Install dependencies: `npm install`
2. Ensure the Elixir API can run: `cd ../elixir_tui && mix deps.get`
3. Start the app: `npm run dev` (or `./start-ai-dev-suite-electron.sh` from repo root—installs RAG deps on startup)

This will:
- Start the Vite dev server (React)
- Build and run Electron
- Spawn the Elixir API at `http://localhost:41434`

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Run Vite + Electron in dev mode |
| `npm run build` | Build for production |
| `npm run build:app` | Package for current platform |
| `npm run build:mac` | Package for macOS (dmg, zip) |
| `npm run build:win` | Package for Windows (nsis) |
| `npm run build:linux` | Package for Linux (AppImage, deb) |

## Packaging & auto-updates

- **Packaging:** `elixir_tui` is bundled as `extraResources`; the app spawns it on launch. Requires **Elixir** + **Mix** on the host.
- **Auto-updates:** electron-updater checks GitHub Releases on startup (production builds only). Publish releases to `zerwiz/setup` for updates to work.

## Structure

```
electron_app/
├── src/
│   ├── main/       # Electron main process
│   ├── preload/    # Preload script (exposes window.api, quitApp)
│   └── renderer/   # React app (Vite)
│       ├── screens/  # Home, Tools, Chat, Drive, Memory, Settings, Server
│       ├── components/  # OllamaStatus, QuitButton
│       └── api.ts    # API client
├── dist/           # Build output
└── release/        # Packaged app (electron-builder)
```

## API

The app talks to the Elixir API at `http://localhost:41434`. Endpoints: `/api/tools`, `/api/chat`, `/api/bye`, `/api/memory`, `/api/drive`, etc.

See `doc/ai-dev-suite/UI_PLANNING.md` for full spec.

## Troubleshooting

- **Linux: GLib/Gtk errors when opening file dialogs** – The app sets `GTK_USE_PORTAL=1` by default to use the XDG portal. If you still see "invalid cast from 'GtkFileChooserNative'" errors, the dialogs usually still work. On some setups, `GTK_USE_PORTAL=0` may behave better.
