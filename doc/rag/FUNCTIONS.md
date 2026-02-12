# RAG – Functions Reference

Complete reference of all functions and commands in the RAG system (`rag/rag.py`).

---

## Overview

RAG indexes documents, runs hybrid retrieval (BM25 + vector), and answers questions via Ollama. Supports web research and evaluation.

---

## 1. Commands (CLI)

| Command | Purpose |
|---------|---------|
| `index` | Index documents (PDF, DOCX, TXT, MD). Chunk, embed, store in ChromaDB. |
| `query` | Answer questions from indexed docs (optionally with web search). |
| `research` | Web search + AI answer. Can merge with indexed docs. Runs web-only without ChromaDB. |
| `eval` | Run evaluation on questions from JSONL file. Outputs metrics to `eval_results.json`. |

---

## 2. CLI Arguments

| Argument | Default | Purpose |
|----------|---------|---------|
| `--index-dir` | `~/.config/ai-dev-suite/rag_index` | ChromaDB index path |
| `--model` | `llama3.2` | Ollama model for generation |
| `--embed-model` | `nomic-embed-text` | Ollama embedding model (fallback: `all-minilm`) |
| `--incremental` | — | Only reindex files with changed hash |
| `--no-cache` | — | Disable query cache |
| `--filter-source` | — | Metadata filter: source path prefix (regex) |
| `--filter-type` | — | Metadata filter: file type (pdf, docx, etc.) |
| `--citations` | — | Print extracted citations after answer |
| `--web` | — | Include web search in `query` command |
| `--context-only` | — | In `research`: output raw context only, no Ollama call (for API integration) |
| `--eval-file` | `eval.jsonl` | Path to eval JSONL file |

---

## 3. Chunking

| Constant/Variable | Value | Purpose |
|-------------------|-------|---------|
| `CHUNK_SIZE` | 512 | Chunk size in **characters** (not tokens) |
| `CHUNK_OVERLAP` | 102 (20%) | Overlap between chunks |
| `SEPARATORS` | `["\n\n", "\n", ". ", " "]` | Recursive split order |

### Functions

| Function | Purpose |
|----------|---------|
| `load_document(path)` | Load PDF, DOCX, TXT, MD. Returns `[(text, metadata), ...]` per page/section. |
| `_split_md_by_sections(text, base_meta)` | Split markdown by `#` headers; adds `section` metadata. |
| `_recursive_split(text, separators, chunk_size, overlap)` | Structure-aware recursive splitter. |
| `chunk_text(text, source, file_type, page, section)` | Chunk with tags: `[file:]` `[type:]` `[source:]` `[page:]` `[section:]`. |

### Supported formats

- **PDF** – pypdf
- **DOCX** – python-docx
- **TXT, MD, .markdown** – direct read; MD split by sections

---

## 4. Embeddings & Ollama

| Function | Purpose |
|----------|---------|
| `get_ollama_embedding(text, model)` | POST to `OLLAMA_URL/api/embeddings`. Truncates to 8000 chars. Fallback to `all-minilm` on failure. |
| `ollama_chat(messages, model)` | POST to `OLLAMA_URL/api/chat`. Non-streaming. 120s timeout. |

### Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API base |
| `RAG_USE_JINA` | `true` | Use Jina Reader for URL fetches when `true` |

---

## 5. Retrieval (Hybrid BM25 + Vector)

| Constant | Value | Purpose |
|----------|-------|---------|
| `TOP_K_RETRIEVE` | 20 | Documents retrieved before fusion |
| `TOP_K_FINAL` | 5 | Documents after RRF fusion |
| `HYBRID_ALPHA` | 0.5 | Not used directly; RRF combines rankings |

### Functions

| Function | Purpose |
|----------|---------|
| `bm25_search(corpus, query, top_k)` | BM25Okapi search. Returns top-k document indices. |
| `reciprocal_rank_fusion(vector_ids, bm25_ids, k=60)` | RRF fuse. `k=60` is standard. Returns fused ranking. |
| `retrieve_hybrid(coll, query, embed_model, where)` | Runs vector query + BM25, fuses with RRF, returns top docs. |

---

## 6. Web Research

| Constant | Value | Purpose |
|----------|-------|---------|
| `WEB_SNIPPET_MAX` | 8 | Max DuckDuckGo snippets |
| `WEB_FETCH_MAX` | 3 | Top N URLs to fetch (full content) |
| `WEB_FETCH_TIMEOUT` | 10 | Request timeout (seconds) |
| `WEB_FETCH_MAX_CHARS` | 8000 | Max chars per fetched page |
| `JINA_READER_BASE` | `https://r.jina.ai/` | Jina Reader URL prefix |

### Functions

| Function | Purpose |
|----------|---------|
| `web_search(query, max_results)` | DuckDuckGo text search. Returns `[{title, href, body}, ...]`. |
| `_fetch_via_jina(url)` | Fetch URL via Jina Reader (markdown). Returns up to 8000 chars. |
| `fetch_url_text(url, prefer_jina)` | Fetch URL; Jina first if enabled, else trafilatura or crude HTML strip. |
| `_extract_urls(text)` | Extract `https?://` URLs from text (unique, order preserved). |
| `build_web_context(query)` | 1) Fetch URLs in query. 2) DuckDuckGo search. 3) Fetch top URLs. 4) Format as `[N] [url: ...] [title: ...]\n{body}`. |

---

## 7. Citations

| Function | Purpose |
|----------|---------|
| `parse_citations(text)` | Extract `[1]`, `[2]`, `[file: path]`, `[url: ...]` from model output. |

---

## 8. Caching

| Variable | Value | Purpose |
|----------|-------|---------|
| `CACHE_TTL` | 300 | Cache TTL in seconds (5 min) |
| `_cache` | `dict` | In-memory cache: `key -> (value, timestamp)` |

| Function | Purpose |
|----------|---------|
| `cache_get(key)` | Return cached value if fresh. |
| `cache_set(key, value)` | Store with current timestamp. |

---

## 9. Logging

| Variable | Value |
|----------|-------|
| `LOG_PATH` | `~/.config/ai-dev-suite/rag.log` |

| Function | Purpose |
|----------|---------|
| `log(event, data)` | Append JSONL line: `{ts, event, ...data}`. |

---

## 10. Incremental Indexing

| Function | Purpose |
|----------|---------|
| `file_hash(path)` | SHA256 of file bytes. |
| `load_index_manifest(index_dir)` | Load `.manifest.json` (path -> hash). |
| `save_index_manifest(index_dir, manifest)` | Write manifest. |

---

## 11. System Prompts

| Variable | Purpose |
|----------|---------|
| `SYSTEM_PROMPT` | Doc-only: answer from context, cite sources, no guess, guardrails. |
| `SYSTEM_PROMPT_WEB` | Doc + web: same rules, add `[url: ...]` cites, prefer docs when available. |

---

## 12. Storage Paths

| Path | Purpose |
|------|---------|
| `~/.config/ai-dev-suite/rag_index/` | ChromaDB collection |
| `~/.config/ai-dev-suite/rag_index/.manifest.json` | Incremental index manifest |
| `~/.config/ai-dev-suite/rag_index/eval_results.json` | Eval output |
| `~/.config/ai-dev-suite/rag.log` | Log file |

---

## 13. Eval JSONL Format

```json
{"question": "...", "expected": "..."}
```

Also accepts: `q`, `expected_answer`. Writes to `eval_results.json` with `question`, `answer`, `expected`, `citations`, `metrics` (e.g. `answer_relevance` from keyword match, `citations_count`).

---

## 14. Integration with AI Dev Suite

- **`/research <query>`** – TUI/API calls `rag research "query" --context-only` to get raw web context, then injects into chat.
- **Internet button** – Same flow: `run_research(query)` → `rag research --context-only` → inject context into user message.
- **RAG deps** – Installed on startup by `start-ai-dev-suite-*.sh` scripts.

---

## 15. File Layout

```
rag/
├── rag.py           # Main script (index, query, research, eval)
├── requirements.txt # chromadb, pypdf, python-docx, requests, rank-bm25, duckduckgo-search, trafilatura
└── README.md

Documentation: doc/rag/
```

---

*WhyNot Productions · whynotproductions.netlify.app*
