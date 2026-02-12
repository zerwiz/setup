# Tools

Standalone terminal tools from WhyNot Productions. Delivered via `curl | bash` from the homepage.

## Available tools

| Tool | Description |
|------|-------------|
| [rag](./rag/) | RAG – index docs, answer with Ollama, web research |
| [ai-dev-suite](./ai-dev-suite/) | AI dev install commands + interactive TUI |

## AI Dev Suite – Start scripts

From this directory (`tools/`):

| Script | Purpose |
|--------|---------|
| `./start-ai-dev-suite-api.sh` | API only (http://localhost:41434) |
| `./start-ai-dev-suite-web.sh` | API + Vite (http://localhost:5174) |
| `./start-ai-dev-suite-electron.sh` | Electron desktop app |
| `./start-ai-dev-suite-tui.sh` | TUI (terminal menu) |

See [doc/ai-dev-suite/START.md](./doc/ai-dev-suite/START.md).

## Documentation

All tool documentation is in **[doc/](./doc/)**:

- [doc/README.md](./doc/README.md) – Overview and index
- [doc/rag/](./doc/rag/) – RAG setup, usage, options
- [doc/ai-dev-suite/](./doc/ai-dev-suite/) – AI Dev Suite (install script, TUI, functions, planning)
