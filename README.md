# WhyNot Productions Tools

**Collaborate with me to make this system better.** It's alpha for now — lots of bugs and lots to do. Your feedback and contributions are welcome.

---

## About me

I'm **Zerwiz** — Lars-Josef Lindbom. Developer. AI educator. Producer.

| Area | Description |
|------|--------------|
| **Education & Integration** | I teach Cursor and AI-powered development. I host technical courses. I help businesses integrate AI. |
| **AI Dev Suite** | Local-first tools: chat, memory, and RAG research. Runs on your machine. One curl install. Works offline with Ollama. |
| **WhyNot Productions** | Creative base for projects and strategy. Roots in extreme sports, music, and festivals. Underground culture. Strategy and production. |
| **UpsideDown Production** | Collaborative AI tool. Engine for festivals. Creative partnerships. Cross-border movement. Creating new formats. |
| **Workflowspace** | Workflow and productivity tools. Streamlined processes. |
| **AffiliateFlow** | Affiliate and revenue flow. Partnership and growth tools. |
| **NorthStarOS** | Operating system for purposeful work. Direction and focus. |

**Principles:** Movement over ego. Collaboration over competition. Action over perfection.

**Network & Reach:** Based in Sweden. Network from the Nordics to the U.S. Fast implementation. Purposeful results.

**Contact:** [Visit my homepage](https://whynotproductions.netlify.app/) for workshops, custom development, or AI integration.

---

These are my terminal and desktop tools: AI Dev Suite, RAG, and more. Delivered via `curl | bash`.

Want to collaborate? **[Join Discord](https://discord.com/invite/p74cGwrdPd)** · **[Book a call](https://cal.com/whynotproductions/)**

**What can the AI Dev Suite do?** Here's the simple version:

| Capability | What it means |
|------------|---------------|
| **One-line install** | Install Zed, Ollama, LM Studio, and other dev tools with a single command. No hunting for installers. |
| **Chat with local LLMs** | Talk to models (Llama, Mistral, etc.) running on your machine via Ollama. Your data stays local. |
| **Memory** | The AI remembers things. Use `/remember` to add notes about yourself or your project. Those notes show up in later chats. |
| **Behavior** | Use `/behavior` to tell the AI how to act—formal, casual, code-focused, etc. It follows those instructions. |
| **Document drive** | Add PDFs, docs, or code files. The AI reads them and uses them as context when you chat. Great for project docs. |
| **Web research** | Ask things like "what's the latest on X?" and the AI can search the web and summarize. Uses DuckDuckGo and fetches URLs you paste. |
| **TUI, Electron, API** | Use it in the terminal (TUI), as a desktop app (Electron), or hook into it via HTTP API. Pick what fits your workflow. |
| **Local agents for IDEs** | Run agents locally (Ollama). Connect to Zed, OpenCode, and other ACP-compatible code IDEs. Your code never leaves your machine. |

### Electron app (Desktop GUI)

The **Electron app** is a desktop GUI with the same backend (Elixir API). Quit saves all chats and workspace. The app spawns the Elixir API automatically at `http://localhost:41434`.

#### Deep insight: Pages and capabilities

| Page | What it does | Key capabilities |
|------|---------------|-------------------|
| **Home** | Dashboard and status | See Ollama status (green dot = running, red = not); list installed models; view config directory path. Quick at-a-glance health check. |
| **Tools** | Install dev tools | One-click install for Zed, OpenCode, Ollama, LM Studio, OpenClaw, Workshop Setup. Each runs its official install script. No hunting for download pages. |
| **Chat** | Main AI interaction | Multiple chat tabs; each can use a different model and knowledge base. **Model picker** selects Ollama model (or download a new one). **KB selector** chooses which documents the AI sees—default (general drive) or a project-specific KB. **Internet** toggle enables web search per message; URLs you paste are fetched directly. **Streaming** shows token-by-token output. Slash commands: `/memory`, `/remember`, `/behavior`, `/drive`, `/research`, `/bye`. Use `/bye` to save conversation facts before quitting. |
| **Drive** | Document context | Create multiple **knowledge bases** (default + custom per project). Add files, folders, or URLs. **Browse files & folders** opens the system file dialog. Supported: PDF, DOCX, TXT, MD, code files (.py, .js, .json, etc.). Files are copied, converted to text, and injected into the chat context (up to ~14K chars). Folder add recursively includes all files. Delete files, delete KBs, multi-select delete. Tree view for hierarchy. |
| **Memory** | Persistent AI context | Three files: `memory.md` (manual notes via `/remember`), `conversation_memory.md` (auto-extracted facts when you type `/bye`), `behavior.md` (tone, style, how the AI should act). View and **edit all three** via modals. Browse button opens the folder; Save writes changes. These files are always injected into the system prompt. |
| **Settings** | Config and paths | **Config directory** holds memory, behavior, drive, and knowledge bases. Browse opens it in your file manager; Select folder lets you pick a different path; Save applies (restart required). Override via `AI_DEV_SUITE_CONFIG_DIR` env var. |
| **Server ↻** | Future integration | Placeholder for llama.cpp server. See [LLAMACPP.md](./doc/ai-dev-suite/LLAMACPP.md). |

**Header:** App title, Ollama status with Refresh/Start, Quit (saves everything and exits).

**Chat workflow:** New chat → pick model → pick KB → toggle Internet if needed → type or use slash commands. Each chat tab is isolated; switch between projects without mixing context.

### TUI (Terminal UI)

The **Elixir TUI** runs in the terminal. It gives you a text menu to:

- **Install tools** — Press `1`–`6` to install Zed, OpenCode, Ollama, LM Studio, OpenClaw, or Workshop Setup; or `a` for all
- **Start Ollama** — Run `ollama serve` in the background
- **Chat** — Pick a model (or download one), then chat with Ollama locally
- **Slash commands** — `/memory` (show manual + conversation memory), `/remember <text>` (add a note), `/behavior` (set tone and style), `/drive add <path>` (add docs to context), `/research <query>` (web search + AI answer), `/bye` (exit and save conversation facts to memory)

Memory, behavior, and drive content are stored in `~/.config/ai-dev-suite/` and injected into the chat context.

---

## Tools

| Tool | Description |
|------|-------------|
| [**RAG**](./rag/) | Index docs, answer with Ollama, web research |
| [**AI Dev Suite**](./ai-dev-suite/) | AI dev install scripts + interactive TUI, Electron app, API |

## AI Dev Suite — Quick start

From this directory:

| Script | Purpose |
|--------|---------|
| `./start-ai-dev-suite-tui.sh` | TUI (terminal menu) |
| `./start-ai-dev-suite-electron.sh` | Electron desktop app |
| `./start-ai-dev-suite-api.sh` | API only (http://localhost:41434) |
| `./start-ai-dev-suite-web.sh` | API + Vite (http://localhost:5174) |

See [doc/ai-dev-suite/START.md](./doc/ai-dev-suite/START.md) for details.

## Install via curl

Tools are hosted in [zerwiz/setup](https://github.com/zerwiz/setup):

```bash
# AI Dev Suite – full install
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install-full.sh | bash

# AI Dev Suite – display install commands
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash

# Workshop Setup (curl, Node, Git)
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh | bash
```

## Docs

| Path | Purpose |
|------|---------|
| [doc/](./doc/) | Overview and index |
| [doc/rag/](./doc/rag/) | RAG setup, usage, options |
| [doc/ai-dev-suite/](./doc/ai-dev-suite/) | AI Dev Suite: START, FUNCTIONS, STORAGE, PLANNING |

## Structure

```
setup/                   # zerwiz/setup – tools repo (this repo)
├── ai-dev-suite/       # Install, TUI, Electron app, ACP adapter (canonical source)
├── rag/                # RAG script and deps
├── doc/                # All tool documentation
├── rules/              # Deployment, GitHub, conventions
├── scripts/            # Automation scripts
└── start-*.sh          # Launch scripts
```

See [doc/STRUCTURE.md](./doc/STRUCTURE.md) for details.

## Develop tools

**zerwiz/setup is the main repo for tools.** Clone it and work here:

```bash
git clone https://github.com/zerwiz/setup.git
cd setup
```

Open `WhyNotProductions-Tools.code-workspace` for a workspace with both setup (primary) and rules (reference).

## Contribute

Contributions are welcome. Check [rules/](./rules/) for conventions and [rules/services/github/](./rules/services/github/) for branch strategy and PR workflow.

---

*Rules and conventions: [rules/](./rules/).*
