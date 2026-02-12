# AI Dev Suite – Storage Locations

All AI Dev Suite and RAG data is stored under your user config directory or app data paths.

## All files the system stores and reads

| File / path | Read by | Written by | Purpose |
|-------------|---------|-----------|---------|
| `memory.md` | Chat (system prompt) | `/remember`, Settings, API PUT | Manual notes, system info, preferences |
| `conversation_memory.md` | Chat (system prompt) | `/bye` (auto-extract) | Conversation facts saved on exit |
| `behavior.md` | Chat (system prompt) | `/behavior`, Settings, API PUT | Tone, style, behavior instructions |
| `preferences.json` | API, Chat | API PUT (on model change) | Preferred model for new chats |
| `drive/` | Chat (KB index) | Drive add, upload | User documents (default knowledge base) |
| `drive/.converted/` | Chat | RAG convert | Converted text from PDF, DOCX, etc. |
| `knowledge-bases/<name>/` | Chat (KB index) | Drive add per KB | Custom KB documents |
| `knowledge-bases/<name>/.converted/` | Chat | RAG convert | Converted docs per KB |
| `rag_index/` | RAG query/research | `rag index` | Chroma vector index |
| `rag_index/.manifest.json` | RAG incremental | `rag index` | File hash manifest |
| `rag_cache/` | RAG query/research | RAG | Query cache (5 min TTL) |
| `rag.log` | — | RAG | Event log |
| `settings.json` (Electron) | Electron main | Settings Save | Config dir override |
| `localStorage` (Electron) | Chat UI | Chat UI | Chats, model presets |

**Paths:**
- Base for config items: `~/.config/ai-dev-suite/` (or override in Settings).
- Electron `settings.json`: `{userData}/settings.json` (e.g. `~/.config/ai-dev-suite-electron/` on Linux).
- Electron localStorage keys: `zerwiz-ai-dev-suite-chats`, `zerwiz-ai-dev-suite-model-presets`.

---

## Base directory

```
~/.config/ai-dev-suite/
```

On Linux/macOS this resolves to `/home/<user>/.config/ai-dev-suite/` or `/Users/<user>/.config/ai-dev-suite/`.

`$HOME` is used when available; otherwise `~` is used. Override with Settings → Config directory (stored in Electron `userData/settings.json`).

---

## Memory files (AI Dev Suite chat)

| File | Purpose |
|------|---------|
| `~/.config/ai-dev-suite/memory.md` | Manual notes added via `/remember` or Settings → Edit. Each entry tagged with `model:` and timestamp. |
| `~/.config/ai-dev-suite/conversation_memory.md` | Auto-extracted facts when you type `bye`. Also tagged with `model:` and timestamp. |
| `~/.config/ai-dev-suite/behavior.md` | Behavior instructions (tone, style). Use `/behavior` to read or add, or Settings → Edit. |

**Format (memory.md, conversation_memory.md):**
```
---
model: llama3.2
2025-02-11T12:34:56Z

{content}
```

---

## Document drive (default knowledge base)

| Path | Purpose |
|------|---------|
| `~/.config/ai-dev-suite/drive/` | Files and folders added via `/drive add <path>`. |
| `~/.config/ai-dev-suite/drive/.converted/` | Converted text for AI use (PDF, DOCX → text with metadata). |

## Knowledge bases

| Path | Purpose |
|------|---------|
| `~/.config/ai-dev-suite/knowledge-bases/<name>/` | Custom knowledge bases. Each has its own folder. |
| `~/.config/ai-dev-suite/knowledge-bases/<name>/.converted/` | Converted documents for that KB. |

**"default"** uses the legacy drive folder. Each chat can connect to a different knowledge base.

---

## RAG tool

| Path | Purpose |
|------|---------|
| `~/.config/ai-dev-suite/rag_index/` | Chroma vector index for indexed documents. |
| `~/.config/ai-dev-suite/rag_index/.manifest.json` | File hash manifest for incremental indexing. |
| `~/.config/ai-dev-suite/rag_cache/` | Query result cache (5 min TTL). |
| `~/.config/ai-dev-suite/rag.log` | RAG event log (index, query, research). |

---

## Summary layout

```
~/.config/ai-dev-suite/
├── memory.md              # Manual RAG memory
├── conversation_memory.md # Auto-extracted conversation facts
├── behavior.md            # Behavior instructions
├── drive/                 # Document drive
│   └── .converted/        # Converted docs for AI
├── rag_index/             # RAG vector index (Chroma)
│   └── .manifest.json
├── rag_cache/             # RAG query cache
└── rag.log                # RAG log
```

---

## AI chat and memory

The chat includes `memory.md` and `conversation_memory.md` in the system prompt. The model is instructed to use this content when answering relevant questions (e.g. "what system do I have", hardware, OS, preferences).

**If the AI doesn't seem to use memory:**
1. Ensure memory.md exists and has content: Settings → memory.md → Edit.
2. Check the config directory (Settings) matches where the API runs. Restart the app after changing it.
3. Default path: `~/.config/ai-dev-suite/memory.md`.

---

## Customizing paths

- **AI Dev Suite:** Use Settings → Config directory to change the base path. Restart to apply.
- **RAG:** Use `--index-dir` to override the Chroma index path when indexing or querying.

## Structure-agnostic path discovery

The AI Dev Suite does **not** assume a fixed file or folder structure. It discovers paths dynamically:

| What | How |
|------|-----|
| **Config dir** | `AI_DEV_SUITE_CONFIG_DIR` env, else `~/.config/ai-dev-suite` |
| **RAG script** | 1) `AI_DEV_SUITE_RAG_SCRIPT` env (absolute path); 2) `rag` in PATH; 3) Walk up from cwd looking for `rag/rag.py` or `rag.py` in any ancestor dir |

**RAG discovery:** If you move files or use a different layout, set `AI_DEV_SUITE_RAG_SCRIPT` to the full path of your `rag.py`. Otherwise the app walks up from the current working directory to find it. Works from any subdirectory of your project.
