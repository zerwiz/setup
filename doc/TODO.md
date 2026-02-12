# Tools – To-Do

Action items derived from [AI Dev Suite FUNCTIONS](./ai-dev-suite/FUNCTIONS.md) and [RAG Best Practices](./rag/RAG_BEST_PRACTICES.md).

---

## AI Dev Suite

### High priority

- [x] **Stream chat responses** – ✅ Done in Electron app (Elixir `/api/chat/stream`, NDJSON, token-by-token).
- [ ] **Align install.sh with TUI** – install.sh has Zed, LM, Ollama, Pinokio, ClawCode (1–5). TUI has Zed, OpenCode, Ollama, LM Studio, OpenClaw, Workshop (1–6). Unify or document the difference.

### Medium priority

- [ ] **Persist preferred model** – Remember last-used model across sessions (e.g. in `~/.config/ai-dev-suite/preferences.json`).
- [ ] **Windows PowerShell install.sh** – install.sh is Mac/Linux only; add PowerShell version for Windows users.

### Low priority / Nice to have

- [x] **Standalone desktop app** – See [UI_PLANNING.md](./ai-dev-suite/UI_PLANNING.md): Electron + React + Phoenix API. **Done:** `tools/ai-dev-suite/electron_app/` with Tools, Chat, Drive, Memory, Settings screens; Elixir API on port 41434.
- [ ] **Drive: HTML support** – Split at `h1`, `h2`, `h3` boundaries; attach header as metadata.
- [ ] **Drive: `[type: table]`** – Detect and tag table content for better model interpretation.
- [ ] **Drive: questions-answered** – LLM extracts "questions this excerpt can answer" per chunk to improve retrieval targeting.

---

## RAG Tool

### High priority

- [ ] **Cross-encoder reranker** – Add ColBERT or Cohere ReRank for top-k → top-3 reranking (currently RRF only).
- [ ] **Token-based chunking** – Switch from 512 chars to 256–512 tokens for predictable API cost and better boundary handling.

### Medium priority

- [ ] **Semantic chunking** – For highest accuracy on technical docs; recursive is general-purpose.
- [ ] **Query expansion** – Rephrase or expand query (synonyms, related questions) for better recall.
- [ ] **Eval: ARES/RAGTruth** – Integrate automated eval frameworks for context relevance, faithfulness, answer relevance.
- [ ] **Zero-downtime reindex runbook** – Document batch reindex procedure for production.

### Low priority / Production hardening

- [ ] **Rate limiting** – Per-IP or per-session limits to avoid abuse.
- [ ] **Load and failure testing** – Establish performance baseline.
- [ ] **Redis caching** – Replace in-memory cache for multi-process or scaled deployments.
- [ ] **Alerting** – Latency and error rate thresholds.

---

## RAG Best Practices Quick Checklist (implementation status)

| Item | Status |
|------|--------|
| Chunk size 256–512 tokens, 10–20% overlap | ⚠️ 512 chars (not tokens), 20% overlap |
| Tags/metadata: [file:] [type:] [section:] | ✅ |
| Chunking: recursive | ✅ |
| Chunking: semantic (highest accuracy) | ❌ Optional |
| Embedding model suitable for domain | ✅ nomic-embed-text |
| Hybrid retrieval (BM25 + vector) | ✅ |
| Reranking for top results | ⚠️ RRF, not cross-encoder |
| Metadata filtering | ✅ |
| Prompt: context-use and citation rules | ✅ |
| Evaluation metrics | ✅ Basic |
| Incremental indexing | ✅ |
| Observability and caching | ✅ Logging, in-memory cache |

---

## Reference

- **AI Dev Suite:** [FUNCTIONS.md](./ai-dev-suite/FUNCTIONS.md), [PLANNING.md](./ai-dev-suite/PLANNING.md)
- **RAG:** [README.md](./rag/README.md), [RAG_BEST_PRACTICES.md](./rag/RAG_BEST_PRACTICES.md)
