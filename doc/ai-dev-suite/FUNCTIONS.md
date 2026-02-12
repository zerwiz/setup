# AI Dev Suite – Functions Reference

Complete reference of everything the AI Dev Suite does.

---

## Overview

The AI Dev Suite has two main parts:

1. **Interactive TUI (Elixir)** – `elixir_tui/` – Menu to install tools + chat with Ollama
2. **Install script (Bash)** – `install.sh` – Displays install commands; can install via `bash -s ollama`

---

## 1. Main Menu (CLI)

| Key | Action |
|-----|--------|
| `[1-6]` | Install tool 1–6 |
| `[a]` | Install all tools |
| `[o]` | Start Ollama server (background) |
| `[c]` | Chat with Ollama |
| `[q]` | Quit |

---

## 2. Installable Tools

| # | Tool | Description | Install command |
|---|------|--------------|-----------------|
| 1 | Zed | High performance code editor. Collaboration. | `curl -f https://zed.dev/install.sh \| sh` |
| 2 | OpenCode | AI code editor. Agents that write and run code. | `curl -fsSL https://opencode.ai/install \| bash` |
| 3 | Ollama | Run LLMs locally. Simple setup. | `curl -fsSL https://ollama.com/install.sh \| sh` |
| 4 | LM Studio | Local LLM runner. Discover and download models. | `curl -fsSL https://lmstudio.ai/install.sh \| bash` |
| 5 | OpenClaw | AI assistant that does things. The lobster way. | `curl -fsSL https://openclaw.ai/install.sh \| bash` |
| 6 | Workshop Setup | Install local development tools. | `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh \| bash` |

---

## 3. Ollama Integration

| Function | What it does |
|----------|--------------|
| **Start Ollama** | Runs `ollama serve` in background; logs to `/tmp/ollama.log` |
| **List models** | Runs `ollama list` and parses model names |
| **Pull model** | Runs `ollama pull <model>` to download |
| **Chat** | Uses Ollama HTTP API (`POST /api/chat`) for chat |

### Downloadable models (picker)

`llama3.2`, `llama3.1`, `mistral`, `mixtral`, `qwen2.5:7b`, `qwen2.5:14b`, `qwen2.5-coder:7b`, `qwen2.5-coder:14b`, `codellama`, `phi3`, `gemma2`, `deepseek-coder`, `neural-chat`, `orca-mini`, `command-r`

### Model picker

- `[0]` – Download model (numbered list)
- `[1–n]` – Choose existing model
- Arrow keys or numbered input (depends on TTY)
- `q` – Cancel

---

## 4. Chat Commands

| Command | Aliases | What it does |
|----------|---------|---------------|
| `/memory` | `/momory`, `/memmory` | Show manual + conversation memory |
| `/memory conv` | — | Show only conversation memory |
| `/memory models` | — | List models used in memory (for doc vs code continuity) |
| `/remember <text>` | `/remeber`, `/rember` | Add manual note to `memory.md` (tagged with current model) |
| `/behavior` | `/behaviour` | Show or add behavior instructions to `behavior.md` |
| `/behavior <text>` | — | Append behavior instruction |
| `/drive` | `/dive` | List documents in drive |
| `/drive add <path>` | — | Copy file or folder to drive and convert for AI |
| `/research <query>` | `/search`, `/reserch` | Web search + AI answer (calls `tools/rag` if available) |
| `/bye` | `bye`, `exit`, `quit` | Exit; auto-extract and save conversation facts |

---

## 5. RAG Memory

| File | Purpose |
|------|---------|
| `memory.md` | Manual notes via `/remember`. Entries tagged with `model:` and timestamp. |
| `conversation_memory.md` | Facts auto-extracted when you type `bye`. Tagged with `model:`. |
| `behavior.md` | Behavior instructions (tone, style). Shown to the model. |

**Storage:** `~/.config/ai-dev-suite/` (see [STORAGE.md](./STORAGE.md))

**Memory format:**
```
---
model: llama3.2
2025-02-11T12:34:56Z

{content}
```

---

## 6. Document Drive & Knowledge Bases

| Function | What it does |
|----------|--------------|
| **Add to drive** | `/drive add <path>` – Copies file/folder to `~/.config/ai-dev-suite/drive/` |
| **Add to KB** | API/Electron: path or URL → copies to knowledge base folder; supports files and folders |
| **Convert** | PDF (pdftotext), DOCX (pandoc), TXT/MD → text with `[file:]` `[type:]` `[source:]` metadata |
| **Load index** | Injects drive tree + converted content (up to ~14K chars) into system prompt |
| **List contents** | Recursive listing; hides `.converted` |

**Electron Drive screen:** Select knowledge base, create new KB, add via path/URL input or **Browse files & folders** button (system file dialog).

**Supported formats:** `.pdf`, `.docx`, `.txt`, `.md`, `.markdown`, `.rst`, `.tex` + fallback for other text files (`.py`, `.js`, `.json`, `.yaml`, etc., valid UTF-8, &lt;500KB)

**Folder add:** When adding a folder path, all files in that folder (recursively) are copied and converted into the knowledge base.

**Requirements:** `pdftotext` (poppler) for PDF, `pandoc` for DOCX

---

## 7. Web Research

| Function | What it does |
|----------|--------------|
| **Internet button** (Chat) | Toggle ON before sending → fetches URLs in your message and injects web context. AI will say if it could reach the internet or not. |
| `/research <query>` | Calls `rag research "query"` (Python RAG tool) |
| **Fallback** | Tries `rag` in PATH; else `python3 tools/rag/rag.py research ...` |
| **Direct URLs** | URLs in your message (e.g. `https://example.com`) are fetched directly, not just searched |
| **System hint** | Model suggests `/research <query>` when user asks for web lookup |

**Requires:** `tools/rag` with `duckduckgo-search`, `requests`, `trafilatura`. ChromaDB optional for web-only.

**Jina API key (optional):** For higher rate limits when fetching URLs, set `JINA_API_KEY` when starting the API (e.g. `JINA_API_KEY=your_key ./start-ai-dev-suite-api.sh`). Get a key at [jina.ai](https://jina.ai/).

**Tip:** Turn the **Internet** button ON (it turns accent-colored) *before* sending. The placeholder will show "web search ON" when active.

**Startup:** RAG deps are installed automatically when you run any `start-ai-dev-suite-*.sh` script. The Elixir API also installs them on launch when started by the Electron app.

---

## 8. Conversation Exit (bye)

| Step | What happens |
|------|--------------|
| 1 | User types `bye` (or `exit`, `quit`, `/bye`) |
| 2 | If ≥2 user messages: extract facts via Ollama |
| 3 | Facts appended to `conversation_memory.md` with `model:` and timestamp |
| 4 | Exit |

**Extraction prompt:** "Extract important facts… one per line. Skip greetings. Capture: preferences, names, topics, project info."

---

## 9. Chat API

| Aspect | Details |
|--------|---------|
| **Endpoint** | `http://localhost:11434/api/chat` |
| **Transport** | curl (non-streaming), 300s timeout |
| **Request** | JSON body via temp file |
| **Response** | Parses `"content":"..."` (handles space after colon) |
| **Context** | System prompt = behavior + memory + drive index + model hints |

---

## 10. Install Script (install.sh)

| Mode | Usage |
|------|-------|
| **Display only** | `curl ... \| bash` – Shows formatted install commands |
| **Install tool** | `curl ... \| bash -s ollama` – Installs specified tool |

**Tools:** `ollama`, `zed`, `lm`, `pinokio`, `claw` (or `1`–`5`)

**Sections:** Core Tools, Model Libraries (Hugging Face, Civitai), Frameworks (Agent OS, BMAD)

---

## 11. Startup Scripts

| Script | Platform | What it does |
|--------|----------|--------------|
| `start.sh` | macOS/Linux | Installs Elixir if needed (brew/apt/dnf/pacman), runs `mix run` |
| `start.ps1` | Windows PowerShell | Installs Elixir via winget/choco if needed, runs `mix run` |
| `start.bat` | Windows CMD | Same as above |

---

## 12. Module Functions (AiDevSuiteTui)

| Function | Visibility | Purpose |
|----------|------------|---------|
| `tools/0` | public | Returns tool list |
| `downloadable_models/0` | public | Returns model names for download picker |
| `run_install/1` | public | Runs shell command, streams output |
| `start_ollama/0` | public | Starts Ollama in background |
| `pull_ollama_model/1` | public | Pulls model via `ollama pull` |
| `list_ollama_models/0` | public | Lists installed models |
| `chat_with_ollama/1` | public | Enters chat loop with model |
| `list_drive_contents/0` | public | Lists drive files recursively |
| `add_to_drive/1` | public | Copies source to drive, converts |
| `format_tool/2` | public | Formats tool for display |
| `config_dir/0` | private | `~/.config/ai-dev-suite` |
| `memory_file_path/0` | private | Path to `memory.md` |
| `conversation_memory_path/0` | private | Path to `conversation_memory.md` |
| `behavior_file_path/0` | private | Path to `behavior.md` |
| `drive_path/0` | private | Path to drive folder |
| `load_rag_memory/0` | private | Loads manual + conversation memory |
| `load_behavior/0` | private | Loads behavior file |
| `load_drive_index/0` | private | Builds drive tree + converted content for prompt |
| `memory_models/0` | private | Extracts unique models from memory files |
| `run_research/1` | private | Invokes RAG research command |
| `ollama_chat/2` | private | HTTP chat via curl |
| `chat_api_loop/2` | private | Chat input loop, command dispatch |
| `parse_chat_command/1` | private | Parses /memory, /remember, etc. |
| `append_to_memory/2` | private | Appends to memory.md with model tag |
| `append_to_conversation_memory/2` | private | Appends to conversation_memory.md |
| `append_to_behavior/1` | private | Appends to behavior.md |
| `extract_on_exit/2` | private | Triggers fact extraction on bye |
| `extract_and_save_conversation_facts/2` | private | LLM extraction → conversation_memory |
| `convert_file_to_text/1` | private | Converts PDF/DOCX/TXT to text with metadata |
| `extract_text/2` | private | Calls pdftotext/pandoc or reads file |
| `load_converted_drive_content/0` | private | Loads converted files for prompt |

---

## 13. CLI Module (AiDevSuiteTui.CLI)

| Function | Purpose |
|----------|---------|
| `main/1` | Entry point; prints header, menu, enters loop |
| `print_header/0` | Prints AI Dev Suite header |
| `print_menu/0` | Prints tool list and options |
| `loop/0` | Main input loop; dispatches 1–6, a, o, c, q |
| `install_at/1` | Installs tool at index |
| `install_all/0` | Installs all tools |
| `chat_with_ollama/0` | Lists models, picker, enters chat |
| `pick_model/1` | Model picker (raw TTY or numbered) |
| `download_model_then_pick/0` | Download picker, then chat |
| `start_ollama/0` | Starts Ollama, prints API URL |
| `pick_model_numbered/1` | Numbered model selection |
| `pick_loop/3` | Arrow-key model picker |
| `read_key/0` | Reads single key (arrows, enter, q) |
| `model_options/1` | Prepends "Download model..." to model list |

---

## 14. File Layout

```
tools/ai-dev-suite/
├── install.sh           # Bash: display/install commands
└── elixir_tui/
    ├── lib/
    │   ├── ai_dev_suite_tui.ex    # Core logic
    │   └── ai_dev_suite_tui/cli.ex # Menu + loop
    ├── mix.exs
    ├── start.sh         # macOS/Linux
    ├── start.ps1        # Windows PowerShell
    └── start.bat        # Windows CMD

Documentation: tools/doc/ai-dev-suite/
```

---

*WhyNot Productions · whynotproductions.netlify.app*
