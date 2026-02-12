# AI Dev Suite Debugger – Electron UI

Desktop app for the debugger, styled like the AI Dev Suite.

## Run

```bash
# From repo root
./start-ai-dev-suite-debugger.sh

# Or from here
npm run dev
```

## Features

- **Status** – API, Ollama, Vite (auto-refresh 10s)
- **Logs** – API log + selectable Suite log (Ollama | A2A | RAG | Electron), last 50 lines each
- **Edit file** – Choose file → Read → edit → Write (project root or ~/.config/ai-dev-suite)
- **Model selector** – Choose any Ollama model for analysis and chat
- **Test Chat** – POST to /api/chat/stream
- **Ask model** – Analysis with full context (health, processes, logs, files)
- **Chat** – Multi-turn conversation with system context
- **Start API / Start Ollama** – Start services when down
- **Run fix** – Execute commands (ollama, mix, npm, bash, sh); Choose file for scripts
- **System** – Processes, terminals, files
- **Past fixes** – RAG memory of previous suggestions

**Suite ↔ Debugger:** Suite "Get debug help" button sends context to A2A; debugger reads Suite logs. A2A starts automatically with the Suite.

See [DEBUGGER_CAPABILITIES.md](../../doc/ai-dev-suite/DEBUGGER_CAPABILITIES.md) for full reference.
