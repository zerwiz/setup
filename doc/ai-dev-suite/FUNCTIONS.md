# AI Dev Suite – Functions Reference

Complete reference of everything the AI Dev Suite does.

---

## Overview

The AI Dev Suite has three main parts:

1. **Interactive TUI (Elixir)** – `elixir_tui/` – Menu to install tools + chat with Ollama
2. **HTTP API (Elixir + Plug)** – `elixir_tui/lib/ai_dev_suite_tui/api_router.ex` – REST API at `http://localhost:41434` for Electron app and external clients
3. **Install script (Bash)** – `install.sh` – Displays install commands; can install via `bash -s ollama`

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

## 2. Installable Tools (TUI)

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
| **Chat stream** | Uses Ollama streaming API for token-by-token output (Electron app) |
| **Thinking** | For thinking-capable models (qwen3, deepseek-r1, etc.), shows reasoning trace above the answer in the chat UI. See [THINKING.md](./THINKING.md) for supported models and usage. |
| **Quit** | Stops Ollama if the app started it; stops API; exits (Electron/TUI) |

### Model options (API)

Supported in `options` for `/api/chat` and `/api/chat/stream`: `temperature`, `num_predict`, `num_ctx`, `top_p`, `top_k`, `repeat_penalty`, `repeat_last_n`, `seed`, `stop` (list of strings).

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
| `/memory` | `/momory`, `/memmory`, `/memroy` | Show manual + conversation memory |
| `/memory conv` | — | Show only conversation memory |
| `/memory models` | — | List models used in memory (for doc vs code continuity) |
| `/remember <text>` | `/remeber`, `/rember` | Add manual note to `memory.md` (tagged with current model) |
| `/behavior` | `/behaviour`, `/behaivour`, `/behavour` | Show or add behavior instructions to `behavior.md` |
| `/behavior <text>` | — | Append behavior instruction |
| `/drive` | `/dive` | List documents in drive |
| `/drive add <path>` | — | Copy file or folder to drive and convert for AI |
| `/research <query>` | `/search`, `/reserch`, `/serach` | Web search + AI answer (calls `rag` if available) |
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
| **Add to KB** | API/Electron: path, URL, or file upload → copies to knowledge base folder; supports files and folders |
| **List KBs** | `list_knowledge_bases/0` – Returns `["default", ...]` |
| **Create KB** | `create_knowledge_base/1` – Creates new knowledge base dir |
| **Delete from KB** | `delete_from_knowledge_base/2`, `delete_batch_from_knowledge_base/2`, `delete_all_from_knowledge_base/1` |
| **Delete KB** | `delete_knowledge_base/1` – Removes custom KB (default cannot be deleted) |
| **Convert** | PDF (pdftotext), DOCX (pandoc), TXT/MD/.rst/.tex → text with `[file:]` `[type:]` `[source:]` metadata. Tables (markdown `|...|`, CSV, TSV) auto-tagged `[type: table]` for model interpretation. |
| **Load index** | `load_drive_index/0`, `load_knowledge_base_index/1`, `load_knowledge_base_indices/1` – Injects drive/KB tree + converted content (up to ~14K chars) into system prompt |
| **List contents** | `list_drive_contents/0`, `list_knowledge_base_contents/1`, `list_knowledge_base_contents_with_paths/1` – Recursive listing; hides `.converted` |

**Electron Drive screen:** Select knowledge base, create new KB, add via path/URL input or **Browse files & folders** button (system file dialog). Supports file upload for direct document add.

**Supported formats:** `.pdf`, `.docx`, `.txt`, `.md`, `.markdown`, `.rst`, `.tex` + fallback for other text files (`.py`, `.js`, `.json`, `.yaml`, etc., valid UTF-8, &lt;500KB)

**Folder add:** When adding a folder path, all files in that folder (recursively) are copied and converted into the knowledge base.

**Requirements:** `pdftotext` (poppler) for PDF, `pandoc` for DOCX

---

## 7. Web Research

| Function | What it does |
|----------|--------------|
| **Internet button** (Chat) | Toggle ON before sending → fetches URLs in your message and injects web context. AI will say if it could reach the internet or not. |
| `/research <query>` | Calls `rag research "query"` (Python RAG tool) |
| **Fallback** | Tries `rag` in PATH; else discovers `rag.py` via `AI_DEV_SUITE_RAG_SCRIPT` or walk-up search |
| **Direct URLs** | URLs in your message (e.g. `https://example.com`) are fetched directly, not just searched |
| **System hint** | Model suggests `/research <query>` when user asks for web lookup |
| **Context-only** | RAG runs with `--context-only` so raw web context is injected; no double Ollama call |

**Requires:** RAG script (`rag` in PATH, or `AI_DEV_SUITE_RAG_SCRIPT`, or `rag.py` found by walking up from cwd). Deps: `duckduckgo-search`, `requests`, `trafilatura`. ChromaDB optional for web-only.

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

## 9. HTTP API Endpoints

Base URL: `http://localhost:41434`. CORS enabled. All JSON.

### Tools

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/tools` | List installable tools (index, id, name, desc, url, cmd) |
| POST | `/api/install` | Run install for tool index (body: `index` or `tool_index`) |

### Ollama

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/ollama/models` | List installed models |
| POST | `/api/ollama/pull` | Pull model (body: `model` or `name`) |
| POST | `/api/ollama/start` | Start Ollama server |
| POST | `/api/ollama/load` | Preload model into memory (body: `model`) |
| POST | `/api/ollama/stop` | Stop Ollama (if app started it) |
| GET | `/api/downloadable_models` | List models for download picker |

### Chat

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/chat` | Non-streaming chat. Body: `model`, `messages`, `knowledge_base` or `knowledge_bases`, `options` |
| POST | `/api/chat/stream` | Streaming chat (NDJSON: `{ delta }`, `{ thinking }`, `{ done }`, `{ error }`). Body: `model`, `messages`, `knowledge_base`/`knowledge_bases`, `options`, `internet_enabled` |

### Memory & Behavior

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/memory` | Combined manual + conversation memory |
| GET | `/api/memory/manual` | Manual memory only |
| GET | `/api/memory/conv` | Conversation memory only |
| GET | `/api/memory/models` | Models used in memory |
| POST | `/api/memory/remember` | Append to memory (body: `text`, `model`) |
| PUT | `/api/memory/manual` | Overwrite manual memory (body: `content` or `text`) |
| PUT | `/api/memory/conv` | Overwrite conversation memory (body: `content` or `text`) |
| GET | `/api/behavior` | Get behavior content |
| POST | `/api/behavior` | Append to behavior (body: `text`) |
| PUT | `/api/behavior` | Overwrite behavior (body: `content` or `text`) |
| POST | `/api/bye` | Extract and save conversation facts (body: `model`, `messages`) |
| GET | `/api/debug/behavior` | Debug info: path, exists, has_content, content_length, content_preview |

### Drive & Knowledge Bases

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/drive` | List drive contents (default KB) |
| POST | `/api/drive` | Add to drive (body: `path` or `source`) |
| GET | `/api/knowledge-bases` | List knowledge bases |
| POST | `/api/knowledge-bases` | Create KB (body: `name` or `id`) |
| GET | `/api/knowledge-bases/:name/contents` | List KB contents with paths |
| POST | `/api/knowledge-bases/:name/add` | Add file/folder/URL to KB (body: `path`, `source`, or `url`) |
| POST | `/api/knowledge-bases/:name/upload` | Upload file to KB (form field: `file`) |
| POST | `/api/knowledge-bases/:name/delete` | Delete file/folder from KB (body: `path` or `rel_path`) |
| POST | `/api/knowledge-bases/:name/delete-batch` | Batch delete (body: `paths` array) |
| POST | `/api/knowledge-bases/:name/delete-all` | Clear all contents from KB |
| DELETE | `/api/knowledge-bases/:name` | Delete custom KB |

### Research & Config

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/research` | Web research (body: `query` or `q`) |
| GET | `/api/config` | Config directory path |
| GET | `/api/preferences` | User preferences (`preferred_model`) |
| PUT | `/api/preferences` | Save preferences (body: `preferred_model` or `preferredModel`) |

---

## 10. Chat API (Ollama)

| Aspect | Details |
|--------|---------|
| **Endpoint** | `http://localhost:11434/api/chat` |
| **Transport** | curl (non-streaming) or streaming via port |
| **Request** | JSON body via temp file |
| **Response** | Parses `"content":"..."` (handles space after colon); streaming returns NDJSON |
| **Context** | System prompt = behavior + memory + drive/KB index + model hints |

---

## 11. Install Script (install.sh)

| Mode | Usage |
|------|-------|
| **Display only** | `curl ... \| bash` – Shows formatted install commands |
| **Install tool** | `curl ... \| bash -s ollama` – Installs specified tool |

**Tools (install.sh):** `zed`, `opencode`, `ollama`, `lm`, `openclaw`, `workshop` (or `1`–`6`). Aligned with TUI.

---

## 12. Startup Scripts

| Script | Platform | What it does |
|--------|----------|--------------|
| `start.sh` | macOS/Linux | Installs Elixir if needed (brew/apt/dnf/pacman), runs `mix run` |
| `start.ps1` | Windows PowerShell | Installs Elixir via winget/choco if needed, runs `mix run` |
| `start.bat` | Windows CMD | Same as above |

---

## 13. Module Functions (AiDevSuiteTui)

### Public – Tools & Ollama

| Function | Purpose |
|----------|---------|
| `tools/0` | Returns tool list |
| `downloadable_models/0` | Returns model names for download picker |
| `run_install/1` | Runs shell command, streams output |
| `start_ollama/0` | Starts Ollama in background |
| `stop_ollama/0` | Stops Ollama if the app started it |
| `pull_ollama_model/1` | Pulls model via `ollama pull` |
| `list_ollama_models/0` | Lists installed models |
| `chat_with_ollama/1` | Enters chat loop with model |
| `format_tool/2` | Formats tool for display |

### Public – Drive & Knowledge Bases

| Function | Purpose |
|----------|---------|
| `list_drive_contents/0` | Lists drive files recursively |
| `add_to_drive/1` | Copies source to drive (default KB), converts |
| `list_knowledge_bases/0` | Returns `["default", ...]` |
| `create_knowledge_base/1` | Creates new KB directory |
| `add_to_knowledge_base/2` | Adds path, URL, or `%Plug.Upload{}` to KB |
| `list_knowledge_base_contents/1` | Lists KB contents (display lines) |
| `list_knowledge_base_contents_with_paths/1` | Lists KB contents with (path, display) tuples |
| `delete_from_knowledge_base/2` | Deletes file/folder from KB |
| `delete_batch_from_knowledge_base/2` | Batch delete from KB |
| `delete_all_from_knowledge_base/1` | Clears KB contents |
| `delete_knowledge_base/1` | Deletes custom KB |
| `load_knowledge_base_index/1` | Builds KB index for system prompt |
| `load_knowledge_base_indices/1` | Merges indices from multiple KBs |

### Public – API (for Electron / external clients)

| Function | Purpose |
|----------|---------|
| `api_build_system_prompt/1` | Builds system prompt from memory, behavior, KB(s). Arg: KB name, list of KBs, or `nil` for default |
| `api_chat_send/3` | Non-streaming chat. Args: model, messages, options |
| `api_chat_send_stream/5` | Streaming chat. Args: model, messages, callback, options, internet_enabled |
| `api_remember/2` | Append to memory.md |
| `api_behavior_append/1` | Append to behavior.md |
| `api_extract_conversation_facts/2` | Extract facts from conversation, save to conversation_memory.md |
| `api_memory_content/0` | Combined memory |
| `api_memory_manual/0` | Manual memory |
| `api_memory_conv/0` | Conversation memory |
| `api_memory_models/0` | Models in memory |
| `api_behavior_content/0` | Behavior content |
| `api_research/1` | Run RAG research |
| `api_config_dir/0` | Config directory path |
| `api_debug_behavior/0` | Debug map for behavior file |
| `api_write_memory_manual/1` | Overwrite memory.md |
| `api_write_memory_conv/1` | Overwrite conversation_memory.md |
| `api_write_behavior/1` | Overwrite behavior.md |

### Private (internal)

| Function | Purpose |
|----------|---------|
| `config_dir/0` | `~/.config/ai-dev-suite` or `AI_DEV_SUITE_CONFIG_DIR` |
| `memory_file_path/0` | Path to `memory.md` |
| `conversation_memory_path/0` | Path to `conversation_memory.md` |
| `behavior_file_path/0` | Path to `behavior.md` |
| `drive_path/0` | Path to drive folder |
| `kb_path/1` | Path to KB directory |
| `load_rag_memory/0` | Loads manual + conversation memory |
| `load_behavior/0` | Loads behavior file |
| `load_drive_index/0` | Builds drive tree + converted content for prompt |
| `load_knowledge_base_index/1` | Builds KB index |
| `memory_models/0` | Extracts unique models from memory files |
| `run_research/1` | Invokes RAG research command |
| `ollama_chat/3` | HTTP chat via curl (non-streaming) |
| `ollama_chat_stream/4` | Streaming chat via port |
| `chat_api_loop/2` | Chat input loop, command dispatch |
| `parse_chat_command/1` | Parses /memory, /remember, etc. (tolerates typos) |
| `append_to_memory/2` | Appends to memory.md with model tag |
| `append_to_conversation_memory/2` | Appends to conversation_memory.md |
| `append_to_behavior/1` | Appends to behavior.md |
| `extract_on_exit/2` | Triggers fact extraction on bye |
| `extract_and_save_conversation_facts/2` | LLM extraction → conversation_memory |
| `convert_file_to_text/1` | Converts PDF/DOCX/TXT to text (drive) |
| `convert_file_to_text_for_kb/2` | Converts file for KB |
| `extract_text/2` | Calls pdftotext/pandoc or reads file |
| `load_converted_drive_content/0` | Loads converted files for prompt |
| `maybe_inject_research/2` | Injects web context when Internet button ON |

---

## 14. CLI Module (AiDevSuiteTui.CLI)

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

## 15. File Layout

```
ai-dev-suite/
├── install.sh           # Bash: display/install commands
├── elixir_tui/
│   ├── lib/
│   │   ├── ai_dev_suite_tui.ex      # Core logic
│   │   ├── ai_dev_suite_tui/cli.ex  # Menu + loop
│   │   └── ai_dev_suite_tui/api_router.ex  # HTTP API (Plug)
│   ├── mix.exs
│   ├── start.sh         # macOS/Linux
│   ├── start.ps1        # Windows PowerShell
│   └── start.bat        # Windows CMD
├── electron_app/        # Desktop GUI (Electron + React)
│   ├── src/
│   │   ├── main/        # Electron main process
│   │   ├── preload/     # Preload script
│   │   └── renderer/    # React app (screens, components)
│   └── ...
└── ...

Documentation: doc/ai-dev-suite/
```

---

*WhyNot Productions · whynotproductions.netlify.app*
