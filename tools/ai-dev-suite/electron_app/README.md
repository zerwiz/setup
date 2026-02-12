# AI Dev Suite – Electron + React Desktop App

Standalone desktop GUI for the AI Dev Suite, using the Elixir backend API and an Electron + React frontend.

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
│   ├── preload/    # Preload script (exposes window.api)
│   └── renderer/   # React app (Vite)
│       ├── screens/  # Home, Tools, Chat, Drive, Memory, Settings
│       └── api.ts    # API client
├── dist/           # Build output
└── release/        # Packaged app (electron-builder)
```

## API

The app talks to the Elixir API at `http://localhost:41434`. Endpoints: `/api/tools`, `/api/chat`, `/api/memory`, `/api/drive`, etc.

See `tools/doc/ai-dev-suite/UI_PLANNING.md` for full spec.
