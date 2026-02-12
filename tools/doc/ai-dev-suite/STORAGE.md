# AI Dev Suite – Storage Locations

All AI Dev Suite and RAG data is stored under your user config directory.

## Base directory

```
~/.config/ai-dev-suite/
```

On Linux/macOS this resolves to `/home/<user>/.config/ai-dev-suite/` or `/Users/<user>/.config/ai-dev-suite/`.

`$HOME` is used when available; otherwise `~` is used.

---

## Memory files (AI Dev Suite TUI chat)

| File | Purpose |
|------|---------|
| `~/.config/ai-dev-suite/memory.md` | Manual notes added via `/remember`. Each entry is tagged with `model:` and timestamp. |
| `~/.config/ai-dev-suite/conversation_memory.md` | Auto-extracted facts when you type `bye`. Also tagged with `model:` and timestamp. |
| `~/.config/ai-dev-suite/behavior.md` | Behavior instructions (tone, style). Use `/behavior` to read or add. |

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

## Customizing paths

- **AI Dev Suite:** Paths are fixed in the Elixir app. Use symlinks if you need a different location.
- **RAG:** Use `--index-dir` to override the Chroma index path when indexing or querying.
