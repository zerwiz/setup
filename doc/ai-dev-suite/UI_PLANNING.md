# AI Dev Suite – Standalone Desktop App (Electron + React)

Planning document for a standalone desktop GUI that runs the AI Dev Suite, using the Elixir backend and an Electron + React frontend.

---

## Overview

**Goal:** Cross-platform desktop app (Mac, Linux, Windows) with a modern GUI that exposes all AI Dev Suite functionality: tool installs, Ollama chat, memory, drive, research.

**Stack (proposed):**
- **Frontend:** Electron + React
- **Backend:** Elixir (Phoenix API) – reuse existing `AiDevSuiteTui` logic
- **Packaging:** electron-builder for distributable binaries

---

## Architecture Options

### Option A: Electron + React + Phoenix API (recommended)

```
┌─────────────────────────────────────────────────┐
│  Electron Shell                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  React UI (WhyNot styling)               │   │
│  │  - Tools list, install buttons           │   │
│  │  - Chat (messages, input, commands)      │   │
│  │  - Drive, Memory, Settings               │   │
│  └──────────────────────┬──────────────────┘   │
│                         │ HTTP / WebSocket      │
│  ┌──────────────────────▼──────────────────┐   │
│  │  Phoenix API (embedded)                  │   │
│  │  - /api/tools, /api/install              │   │
│  │  - /api/chat (streaming)                  │   │
│  │  - /api/memory, /api/drive, /api/research│   │
│  │  Uses AiDevSuiteTui module               │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
         │
         │ Calls Ollama, filesystem
         ▼
   ~/.config/ai-dev-suite/
   localhost:11434 (Ollama)
```

**Pros:** Reuse all Elixir logic; single codebase; streaming chat feasible.  
**Cons:** Bundle Erlang/Elixir runtime (~50–80 MB) or require user to have it.

---

### Option B: Electron + React + Node backend

Node backend reimplements the logic; shells out to `ollama`, reads/writes config files, invokes `rag research` via child_process.

**Pros:** No Erlang runtime; smaller bundle.  
**Cons:** Duplicate logic; drift between TUI and GUI.

---

### Option C: Electron + React, Elixir as child process

Electron spawns the Elixir app as a subprocess; communicates via stdio (JSON-RPC or similar).

**Pros:** Keeps Elixir app separate; no Phoenix.  
**Cons:** More awkward IPC; harder to stream; process lifecycle.

---

### Recommendation: Option A

Add Phoenix to the existing Elixir project as an optional mode. The TUI remains the default; the GUI runs Phoenix and opens the Electron window. Shared `AiDevSuiteTui` module for all logic.

---

## Project Structure

```
tools/ai-dev-suite/
├── elixir_tui/              # Existing – becomes shared lib
│   ├── lib/
│   │   ├── ai_dev_suite_tui.ex     # Core (unchanged)
│   │   └── ai_dev_suite_tui/
│   │       ├── cli.ex              # TUI entry
│   │       └── api.ex              # NEW: Phoenix context / API helpers
│   └── ...
├── phoenix_api/             # NEW: Phoenix app (or umbrella)
│   ├── lib/ai_dev_suite_web/
│   │   ├── router.ex
│   │   ├── controllers/
│   │   └── channels/        # Optional: streaming chat
│   └── ...
└── electron_app/            # NEW: Electron + React
    ├── src/
    │   ├── main/            # Electron main process
    │   └── renderer/       # React app
    ├── package.json
    └── electron-builder.json
```

---

## API Endpoints (Phoenix)

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/tools | List installable tools |
| POST | /api/install | Run install for tool index |
| GET | /api/ollama/models | List Ollama models |
| POST | /api/ollama/pull | Pull model by name |
| POST | /api/ollama/start | Start Ollama server |
| POST | /api/chat | Send message, get reply (or stream via WebSocket) |
| GET | /api/memory | Get memory content |
| POST | /api/memory/remember | Append to memory |
| GET | /api/memory/models | List models in memory |
| GET | /api/behavior | Get behavior |
| POST | /api/behavior | Append to behavior |
| GET | /api/drive | List drive contents |
| POST | /api/drive | Add path to drive |
| POST | /api/research | Web research (query string) |

---

## UI Screens (React)

### 1. Home / Dashboard

- Header: "AI Dev Suite" + WhyNot branding
- Cards: [Install Tools] [Chat] [Drive] [Settings]
- Status: Ollama running? Last model? Memory loaded?

### 2. Tools

- List of 6 tools (Zed, OpenCode, Ollama, etc.)
- Install button per tool
- [Install All]
- Links to each tool’s URL

### 3. Chat

- Model picker (dropdown or modal)
- [Download model] option
- Message list (user / assistant)
- Input + Send
- Slash commands: /memory, /remember, /drive, /research, /bye
- "…" while waiting

### 4. Drive

- Knowledge base selector + Create KB
- Path input for file/folder/URL + [Add to KB] button
- [Browse files & folders] button (Electron) – system file dialog to pick local files/folders
- File tree or list of contents
- Converted status per file

### 5. Memory & Behavior

- Tabs or sections: Memory, Conversation memory, Behavior
- Read-only view + [Add] for /remember and /behavior
- Show model tags

### 6. Settings

- Config path
- Default model
- RAG script path (for /research)

---

## Styling (WhyNot Productions)

| Element | Value |
|---------|-------|
| Background | #030406 |
| Card/surface | #0a0c10 |
| Border | #1a1d23 |
| Accent | #ff3b30 |
| Body text | #d1d5db |
| Muted | #6b7280 |
| Cyan (links) | #0ea5e9 or similar |

Use CSS variables; dark theme by default. Tailwind or styled-components.

---

## Electron Setup

- **Main process:** Start Phoenix (or connect to it), create BrowserWindow, load React app.
- **Preload:** Expose safe API (e.g. `window.api.invoke`) for renderer.
- **Packaging:** electron-builder; include Erlang/Elixir release or document as prerequisite.

### Bundle options

1. **Bundled:** Phoenix + release in app.asar or extraResources. Largest (~100–150 MB).
2. **Prerequisite:** User installs Elixir/Phoenix; app finds `mix` or release. Smaller app.
3. **Hybrid:** Ship a minimal Beam release; no mix. Medium size.

---

## Phased Implementation

### Phase 1: API + minimal UI (2–3 weeks)

- Add Phoenix to elixir_tui (or new umbrella app)
- Implement /api/tools, /api/ollama/models, /api/chat
- Electron + React shell; Tools screen + Chat screen
- No streaming; basic styling

### Phase 2: Full feature parity (2–3 weeks)

- All endpoints (memory, drive, behavior, research)
- Slash commands in chat
- Drive screen, Memory screen

### Phase 3: Polish (1–2 weeks)

- Streaming chat
- WhyNot design system
- Packaging for Mac, Windows, Linux
- Auto-updates (optional)

---

## Dependencies

| Layer | Tech |
|-------|------|
| Electron | electron, electron-builder |
| React | react, react-dom |
| Build | Vite or Create React App |
| Styling | Tailwind CSS or styled-components |
| Elixir | Phoenix, plug_cowboy |
| State | React Query or Zustand for API caching |

---

## Open Questions

1. **Bundle Elixir or require install?** Affects download size and setup.
2. **Tauri vs Electron?** Tauri is lighter but uses Rust; no React default.
3. **Streaming:** WebSocket channel for chat or SSE?
4. **Auto-start Phoenix:** When app opens, or only when user hits Chat?

---

## References

- [FUNCTIONS.md](./FUNCTIONS.md) – What the TUI does
- [STORAGE.md](./STORAGE.md) – Config paths
- [PLANNING.md](./PLANNING.md) – Current implementation status
- Electron: https://www.electronjs.org/
- Phoenix: https://hexdocs.pm/phoenix/
