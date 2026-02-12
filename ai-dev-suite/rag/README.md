# RAG

Index documents and answer with Ollama. Web research support.

**Quick start:** `python rag.py index <files>` then `python rag.py query "question"`

**Production (env):** `RAG_REDIS_URL`, `RAG_ALERT_WEBHOOK`, `RAG_ALERT_LATENCY_MS`. API rate limit: `RAG_RATE_LIMIT_PER_MIN`. See [doc/ai-dev-suite/rag/PRODUCTION_HARDENING.md](../../doc/ai-dev-suite/rag/PRODUCTION_HARDENING.md).

**New options:**
- `--chunk-tokens 512` – Token-based chunking (tiktoken)
- `--chunk-strategy semantic` – Paragraph-aware semantic chunking
- `--expand-query` – LLM query expansion for better recall
- `--no-rerank` – Disable cross-encoder reranker (RRF only)
- `--eval-ares` – Write ARES-compatible TSV for ares-ai

**Web research (Internet mode):** URLs are fetched via [Jina Reader](https://r.jina.ai/) for clean markdown; falls back to direct fetch if needed. **Jina API key (optional):** For higher rate limits, set `JINA_API_KEY` when starting the API (e.g. `JINA_API_KEY=your_key ./start-ai-dev-suite-api.sh`). Get a key at [jina.ai](https://jina.ai/).

For web-only research without ChromaDB, install minimal deps:
```bash
pip install duckduckgo-search requests trafilatura
```
Then: `python rag.py research "query" --context-only` — fetches URLs in the query directly and outputs raw context.

**Full documentation:** [doc/ai-dev-suite/rag/](../../doc/ai-dev-suite/rag/)
