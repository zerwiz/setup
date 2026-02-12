# RAG

Index documents and answer with Ollama. Web research support.

**Quick start:** `python rag.py index <files>` then `python rag.py query "question"`

**Web research (Internet mode):** URLs are fetched via [Jina Reader](https://r.jina.ai/) for clean markdown; falls back to direct fetch if needed. **Jina API key (optional):** For higher rate limits, set `JINA_API_KEY` when starting the API (e.g. `JINA_API_KEY=your_key ./start-ai-dev-suite-api.sh`). Get a key at [jina.ai](https://jina.ai/).

For web-only research without ChromaDB, install minimal deps:
```bash
pip install duckduckgo-search requests trafilatura
```
Then: `python rag.py research "query" --context-only` — fetches URLs in the query directly and outputs raw context.

**Full documentation:** [tools/doc/rag/](../doc/rag/)
