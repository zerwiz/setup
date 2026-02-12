# Tools Documentation

Hello! This is your guide to the terminal tools and utilities from [WhyNot Productions](https://whynotproductions.netlify.app)—lightweight scripts you can run with `curl | bash` right from the homepage. Below you’ll find what’s available and how to get started.

---

## Contents

- [Available tools](#available-tools)
- [Documentation index](#documentation-index)
- [Adding a new tool](#adding-a-new-tool)

---

## Available tools

| Tool | Description |
|------|-------------|
| **[RAG](./rag/)** | Index docs and answer with Ollama; web research. |
| **[AI Dev Suite](./ai-dev-suite/)** | Install commands, Elixir TUI, Electron desktop app (Home, Chat, Drive, Memory, Tools, Settings, Server ↻). API on `:41434`. Internet/web search in Chat. Full install: `curl \| bash` → `ai-dev-suite-api`, `ai-dev-suite-web`, `ai-dev-suite-tui`, `ai-dev-suite-electron`. |
| **Workshop Setup** | Installs curl, Node.js, Git. Push to zerwiz/setup. |

### Quick start commands

```bash
# RAG
python tools/rag/rag.py index <files>
python tools/rag/rag.py query "<question>"

# AI Dev Suite (full install: API, Web, TUI, Electron)
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install-full.sh | bash

# AI Dev Suite (display install commands)
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash

# Workshop Setup
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh | bash
```

---

## Documentation index

### General

| Doc | Description |
|-----|-------------|
| [Structure](./STRUCTURE.md) | Tools folder structure – ai-dev-suite, rag, doc, deployment |
| [INSTALL_COMMANDS](./INSTALL_COMMANDS.md) | Terminal install commands; shareable: whynotproductions.netlify.app/install |
| [TODO](./TODO.md) | Action items from FUNCTIONS and RAG Best Practices |
| [RAG](./rag/README.md) | Setup, usage, options |
| [RAG Functions](./rag/FUNCTIONS.md) | Full reference: commands, functions, constants |
| [RAG Best Practices](./rag/RAG_BEST_PRACTICES.md) | How to build production RAG (chunking, embeddings, retrieval) |
| [AI Chatbot Integration](./AI_CHATBOT_INTEGRATION.md) | Add chatbot to site (widget vs custom + Netlify Function) |

### AI Dev Suite

| Doc | Description |
|-----|-------------|
| [README](./ai-dev-suite/README.md) | Install script, Elixir TUI, Electron desktop app |
| [Start](./ai-dev-suite/START.md) | Start commands: API, web UI, Electron, TUI (scripts in `tools/`) |
| [Functions](./ai-dev-suite/FUNCTIONS.md) | Full command/module reference (chat, drive, memory, research) |
| [Storage](./ai-dev-suite/STORAGE.md) | Where memory, drive, and RAG data are stored |
| [llama.cpp](./ai-dev-suite/LLAMACPP.md) | llama.cpp vs Ollama; Server screen placeholder |
| [Zed & OpenCode ACP](./ai-dev-suite/ZED_OPENCODE_ACP.md) | Full implementation: connect AI Dev Suite to Zed/OpenCode via Agent Client Protocol |
| [Planning](./ai-dev-suite/PLANNING.md) | Roadmap and implementation status |
| [UI Planning](./ai-dev-suite/UI_PLANNING.md) | Desktop app architecture (Electron + React + Elixir) |
| [TUI quick start](./ai-dev-suite/elixir-tui.md) | Interactive menu quick start |

---

## Adding a new tool

1. Create `tools/<name>/` with `install.sh` and `README.md`
2. Add to `docs/for-zerwiz-setup/` (full program for zerwiz/setup)
3. Add terminal block on the front page
4. Push to zerwiz/setup (see `docs/for-zerwiz-setup/PUSH_TO_SETUP.md`)
5. Add doc to `tools/doc/<name>/`

---

*Developer: [zerwiz](https://github.com/zerwiz)*
