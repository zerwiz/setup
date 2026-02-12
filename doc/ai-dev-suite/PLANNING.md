# Planning – AI Dev Suite

Standalone terminal tool for AI development resources. Delivered via `curl | bash` from zerwiz/setup. Uses WhyNot Productions visual language in the terminal.

---

## Goals (Original & Achieved)

| Goal | Status |
|------|--------|
| Deliver AI Dev content in the terminal | ✅ Done – Core Tools, Model Libraries, Frameworks |
| WhyNot Productions look (ANSI) | ✅ Done – red accent, dim gray, cyan links |
| curl \| bash from front page | ✅ Done – via zerwiz/setup |
| Copyable install commands | ✅ Done |
| Interactive menu | ✅ Done – Elixir TUI |
| Direct install (`bash -s ollama`) | ✅ Done |
| Chat with Ollama | ✅ Done – full RAG memory, drive, research |

---

## Implemented: Install Script (install.sh)

**Delivery:** `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash`

| Feature | Status |
|---------|--------|
| Display-only mode | ✅ |
| Install mode (`bash -s ollama`) | ✅ ollama, zed, lm, pinokio, claw |
| TTY detection (skip colors when piped) | ✅ |
| Core Tools (Zed, LM Studio, Ollama, Pinokio, ClawCode) | ✅ |
| Model Libraries (Hugging Face, Civitai) | ✅ |
| Frameworks (Agent OS, BMAD) | ✅ |

---

## Implemented: Elixir TUI (elixir_tui/)

**Run:** `./elixir_tui/start.sh` (Mac/Linux) or `start.ps1`/`start.bat` (Windows)

| Feature | Status |
|---------|--------|
| Main menu [1-6], [a], [o], [c], [q] | ✅ |
| Install tools 1–6 (Zed, OpenCode, Ollama, LM Studio, OpenClaw, Workshop) | ✅ |
| Install all [a] | ✅ |
| Start Ollama [o] | ✅ |
| Chat with Ollama [c] | ✅ |
| Model picker (arrow keys or numbered) | ✅ |
| [0] Download model from list | ✅ |
| Chat: full conversation history + system prompt | ✅ |

### Chat Commands (Implemented)

| Command | Status |
|---------|--------|
| `/memory`, `/memory conv`, `/memory models` | ✅ |
| `/remember <text>` (tagged with model) | ✅ |
| `/behavior`, `/behavior <text>` | ✅ |
| `/drive`, `/drive add <path>` | ✅ |
| `/research <query>` (web search + AI) | ✅ |
| `/bye` (exit, auto-extract facts) | ✅ |

### RAG Memory (Implemented)

| File | Purpose |
|------|---------|
| `memory.md` | Manual via `/remember`; model + timestamp per entry |
| `conversation_memory.md` | Auto-extracted on `/bye`; model + timestamp |
| `behavior.md` | Behavior instructions |

**Storage:** `~/.config/ai-dev-suite/` (see [STORAGE.md](./STORAGE.md))

### Document Drive (Implemented)

| Feature | Status |
|---------|--------|
| `/drive add <path>` | ✅ Copies file/folder |
| PDF conversion (pdftotext) | ✅ |
| DOCX conversion (pandoc) | ✅ |
| TXT/MD/RST/TEX | ✅ |
| Metadata tags `[file:]` `[type:]` `[source:]` | ✅ |
| Drive content in system prompt | ✅ |

### Web Research (Implemented)

| Feature | Status |
|---------|--------|
| `/research <query>` | ✅ Calls tools/rag research |
| Fallback: rag in PATH or python3 script | ✅ |
| Model suggests /research when asked for web lookup | ✅ |

---

## Technical Approach

### Delivery

- **Bash script:** `install.sh` – display or install (push to zerwiz/setup)
- **Elixir TUI:** `elixir_tui/` – interactive; start scripts install Elixir if needed
- **Workshop Setup:** Installs TUI to `~/bin/ai-dev-suite` via zerwiz/setup

### Terminal Styling (ANSI)

| WhyNot color | Hex     | ANSI           |
|--------------|---------|----------------|
| Red accent   | #ff3b30 | `\033[91m`     |
| Headings     | white   | Bold white     |
| Muted        | #6b7280 | Dim `\033[2m`  |
| Links        | —       | Cyan           |

### File Layout

```
tools/ai-dev-suite/
├── install.sh           # Bash: display/install
├── elixir_tui/
│   ├── lib/ai_dev_suite_tui.ex
│   ├── lib/ai_dev_suite_tui/cli.ex
│   ├── start.sh, start.ps1, start.bat
│   └── mix.exs
└── doc/                 # tools/doc/ai-dev-suite/
    ├── README.md
    ├── FUNCTIONS.md
    ├── STORAGE.md
    └── PLANNING.md      # This file
```

---

## Checklist (All Done)

- [x] Create `tools/ai-dev-suite/install.sh`
- [x] Push to zerwiz/setup; front page curl blocks
- [x] Add AI Dev Suite terminal block to front page
- [x] Add `tools/ai-dev-suite/README.md`
- [x] Elixir TUI with interactive menu
- [x] Ollama: start, list, pull, chat
- [x] Model picker with download option [0]
- [x] RAG memory (memory.md, conversation_memory.md, behavior.md)
- [x] Model tagging in memory; /memory models
- [x] Document drive (/drive add, PDF/DOCX conversion)
- [x] Web research (/research via tools/rag)
- [x] /bye as exit command
- [x] Documentation in tools/doc/ai-dev-suite/

---

## Future / Optional

- [ ] Windows PowerShell version of install.sh (currently Mac/Linux)
- [ ] Persist preferred model across sessions
- [x] Stream chat responses – ✅ Done in Electron app (desktop UI streams; TUI remains non-streaming)

---

*Created 2025-02 · Updated for full implementation*
