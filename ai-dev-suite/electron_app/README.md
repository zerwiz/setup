# Zerwiz AI Dev Suite – Electron Desktop App

Hello and welcome to the **Zerwiz AI Dev Suite** desktop app. This is a standalone GUI for AI dev tools: install Zed, OpenCode, Ollama, LM Studio, OpenClaw, Workshop Setup; chat with Ollama; manage memory, drive, and knowledge bases. Uses the Elixir backend API and an Electron + React frontend. Styled with the WhyNot Productions look.

- **Home page:** [whynotproductions.netlify.app](https://whynotproductions.netlify.app)
- **Full documentation:** [tools/doc/ai-dev-suite/](../../doc/ai-dev-suite/)

## Header

- **Zerwiz AI Dev Suite** – App title
- **Ollama status** – Green dot when running, red when not (with Refresh / Start Ollama)
- **Quit** – Saves workspace (chats to localStorage, conversation facts to memory) and exits
- **Nav** – Home, Tools, Chat, Drive, Memory, Settings

## Screens

| Screen | Purpose |
|--------|---------|
| **Home** | Models list, Ollama status, config dir |
| **Tools** | Install Zed, OpenCode, Ollama, LM Studio, OpenClaw, Workshop Setup |
| **Chat** | Ollama chat with model picker, KB selector, Upload doc, Download model. Slash commands: `/memory` `/remember` `/drive` `/research` `/bye` |
| **Drive** | List and add documents for AI context |
| **Memory** | Manual + conversation memory; add notes with /remember |
| **Settings** | Config path, defaults |

## Chat

- **+ New chat** – Create session; chats auto-save to localStorage
- **Rename** – Double-click a tab or use Rename button
- **Model** – Select Ollama model (e.g. `llama3.1:latest`)
- **KB** – Knowledge base for this chat; Upload doc adds files to it
- **Slash commands** – `/memory` `/remember` `/drive` `/research` `/bye` (use `/bye` in chat to save conversation facts before quitting)
- **Quit** – Click header Quit to save everything and exit

## Prerequisites

- **Node.js** 18+
- **Elixir** + **Mix** (for the API backend)
- **Ollama** (optional, for chat)

## Quick start

1. Install dependencies: `npm install`
2. Ensure the Elixir API can run: `cd ../elixir_tui && mix deps.get`
3. Start the app: `npm run dev`

This will:
- Start the Vite dev server (React)
- Build and run Electron
- Spawn the Elixir API at `http://localhost:41434`

## Scripts

| Command       | Purpose                              |
|---------------|--------------------------------------|
| `npm run dev` | Run Vite + Electron in dev mode      |
| `npm run build` | Build for production               |
| `npm run build:app` | Package with electron-builder |

## Structure

```
electron_app/
├── src/
│   ├── main/       # Electron main process
│   ├── preload/    # Preload script (exposes window.api, quitApp)
│   └── renderer/   # React app (Vite)
│       ├── screens/  # Home, Tools, Chat, Drive, Memory, Settings
│       ├── components/  # OllamaStatus, QuitButton
│       └── api.ts    # API client
├── dist/           # Build output
└── release/        # Packaged app (electron-builder)
```

## API

The app talks to the Elixir API at `http://localhost:41434`. Endpoints: `/api/tools`, `/api/chat`, `/api/bye`, `/api/memory`, `/api/drive`, etc.

See `tools/doc/ai-dev-suite/UI_PLANNING.md` for full spec.
