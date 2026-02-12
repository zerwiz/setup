# Tools – To-Do

Action items consolidated from all docs: [FUNCTIONS](./ai-dev-suite/FUNCTIONS.md), [PLANNING](./ai-dev-suite/PLANNING.md), [SERVER](./ai-dev-suite/SERVER.md), [LLAMACPP](./ai-dev-suite/LLAMACPP.md), [GITHUB_AGENT](./ai-dev-suite/GITHUB_AGENT.md), [ZED_OPENCODE_ACP](./ai-dev-suite/ZED_OPENCODE_ACP.md), [UI_PLANNING](./ai-dev-suite/UI_PLANNING.md), [AI_CHATBOT_INTEGRATION](./AI_CHATBOT_INTEGRATION.md), [RAG_BEST_PRACTICES](./ai-dev-suite/rag/RAG_BEST_PRACTICES.md).

---

## AI Dev Suite

### High priority

- [x] **Stream chat responses** – ✅ Done in Electron app (Elixir `/api/chat/stream`, NDJSON, token-by-token).
- [x] **Align install.sh with TUI** – ✅ Done. install.sh now matches TUI: Zed, OpenCode, Ollama, LM Studio, OpenClaw, Workshop (1–6).

### Medium priority

- [x] **Persist preferred model** – ✅ Done. Stored in `~/.config/ai-dev-suite/preferences.json`; API GET/PUT `/api/preferences`; Electron Chat saves on model change, loads on first run.
- [x] **Windows PowerShell install.sh** – ✅ Done. `install.ps1` with winget (Zed, LM Studio), download (Ollama, OpenCode), optional bash for OpenClaw/Workshop.

### Zed & OpenCode ACP integration

From [ZED_OPENCODE_ACP.md](./ai-dev-suite/ZED_OPENCODE_ACP.md) – connect AI Dev Suite to code IDEs via Agent Client Protocol:

- [x] Create `ai-dev-suite/acp-adapter/` with package.json and TypeScript
- [x] Implement stdio JSON-RPC transport
- [x] Implement `initialize` handler
- [x] Implement session setup handler
- [x] Implement `session/prompt` handler → HTTP to `/api/chat/stream`
- [x] Map streaming response to `session/update` (agent_message_chunk)
- [x] Add `ai-dev-suite-acp` launcher script (`start-ai-dev-suite-acp.sh`)
- [x] Document Zed config in START.md and ZED_OPENCODE_ACP.md
- [x] **Document OpenCode config** – ✅ Done. ZED_OPENCODE_ACP.md §7: status, expected config if OpenCode adds it, where to check, use Zed/JetBrains today.
- [x] Update doc/ai-dev-suite/README.md with ACP integration
- [x] Add CHANGELOG entry when shipped

### Low priority / Nice to have

- [x] **Standalone desktop app** – See [UI_PLANNING.md](./ai-dev-suite/UI_PLANNING.md): Electron + React + Phoenix API. **Done:** `ai-dev-suite/electron_app/` with Tools, Chat, Drive, Memory, Settings screens; Elixir API on port 41434.
- [x] **Drive: HTML support** – ✅ Done. Split at h1/h2/h3; each section gets `[section: Title]` metadata.
- [x] **Drive: `[type: table]`** – ✅ Done. Detects markdown tables (2+ pipes/line) and CSV/TSV (consistent delimiter count); adds `[type: table]` to header. `.csv` files get `[type: table]` by extension.
- [ ] **Drive: questions-answered** – LLM extracts "questions this excerpt can answer" per chunk to improve retrieval targeting.

### Server (llama.cpp) – from [SERVER.md](./ai-dev-suite/SERVER.md), [LLAMACPP.md](./ai-dev-suite/LLAMACPP.md)

- [x] **Implement Server ↻ screen** – ✅ Done. Start and stop llama.cpp servers; configure model path, port, server binary; use custom GGUF models as alternative to Ollama.

### GitHub Agent – from [GITHUB_AGENT.md](./ai-dev-suite/GITHUB_AGENT.md)

- [ ] **GitHub repo integration** – AI agent reads user's GitHub repos for development help. Connect via PAT; fetch contents via REST API; add to KB or inject as chat context. Options: GitHub-as-KB-source, on-demand repo context, or dedicated GitHub screen. *Investigation doc done.*

### Zed & OpenCode ACP – optional (from [ZED_OPENCODE_ACP.md](./ai-dev-suite/ZED_OPENCODE_ACP.md))

- [ ] **ACP tool calls** – Map ACP tool requests to API (e.g. `research` tool → `POST /api/research`). *First version can omit; text chat only.*

### UI Planning – from [UI_PLANNING.md](./ai-dev-suite/UI_PLANNING.md)

- [x] **Auto-updates** – ✅ Done. electron-updater; checks GitHub Releases on startup (production only).
- [x] **Packaging** – ✅ Done. electron-builder; Mac (dmg/zip), Win (nsis), Linux (AppImage/deb); elixir_tui in extraResources.

---

## RAG Tool

**Current implementation:** `ai-dev-suite/rag/rag.py` – recursive chunking (512 chars), hybrid BM25+vector, RRF fusion, incremental index, basic eval, in-memory cache. See RAG Best Practices checklist below.

### High priority

- [x] **Cross-encoder reranker** – ✅ Done. sentence-transformers `cross-encoder/ms-marco-MiniLM-L6-v2`; top-20 → rerank → top-5. `--no-rerank` to disable.
- [x] **Token-based chunking** – ✅ Done. `--chunk-tokens 512` (or 256); tiktoken; 20% overlap.

### Medium priority

- [x] **Semantic chunking** – ✅ Done. `--chunk-strategy semantic` (paragraph-aware, token-based splits).
- [x] **Query expansion** – ✅ Done. `--expand-query` uses LLM to generate alternatives; RRF across variants.
- [x] **Eval: ARES/RAGTruth** – ✅ Done. `--eval-ares` writes ARES-compatible TSV for ares-ai integration.
- [x] **Zero-downtime reindex runbook** – ✅ Done. `doc/ai-dev-suite/rag/REINDEX_RUNBOOK.md` – staging dir, swap, rollback.

### Low priority / Production hardening

- [x] **Rate limiting** – ✅ Done. Per-IP on `/api/research` via `RAG_RATE_LIMIT_PER_MIN` (Elixir RateLimitPlug).
- [x] **Load and failure testing** – ✅ Done. `ai-dev-suite/rag/scripts/load-test.sh` + LOAD_TESTING.md.
- [x] **Redis caching** – ✅ Done. `RAG_REDIS_URL` enables Redis; falls back to in-memory.
- [x] **Alerting** – ✅ Done. `RAG_ALERT_WEBHOOK` + `RAG_ALERT_LATENCY_MS` for latency/error alerts.

---

## RAG Best Practices Quick Checklist (implementation status)

| Item | Status |
|------|--------|
| Chunk size 256–512 tokens, 10–20% overlap | ✅ `--chunk-tokens 512` (tiktoken) |
| Tags/metadata: [file:] [type:] [section:] | ✅ |
| Chunking: recursive | ✅ |
| Chunking: semantic (highest accuracy) | ✅ `--chunk-strategy semantic` |
| Embedding model suitable for domain | ✅ nomic-embed-text |
| Hybrid retrieval (BM25 + vector) | ✅ |
| Reranking for top results | ✅ Cross-encoder (sentence-transformers) |
| Metadata filtering | ✅ |
| Prompt: context-use and citation rules | ✅ |
| Evaluation metrics | ✅ Basic + ARES output (`--eval-ares`) |
| Incremental indexing | ✅ |
| Observability and caching | ✅ Logging, in-memory cache |

---

## Reference (source docs)

| Doc | TODOs / items |
|-----|---------------|
| [FUNCTIONS.md](./ai-dev-suite/FUNCTIONS.md) | Function reference (no checklist) |
| [PLANNING.md](./ai-dev-suite/PLANNING.md) | Future/optional: Windows install, persist model |
| [SERVER.md](./ai-dev-suite/SERVER.md) | llama.cpp Server ↻ integration |
| [LLAMACPP.md](./ai-dev-suite/LLAMACPP.md) | Context for Server; no direct TODOs |
| [ZED_OPENCODE_ACP.md](./ai-dev-suite/ZED_OPENCODE_ACP.md) | ACP adapter + optional tool calls |
| [UI_PLANNING.md](./ai-dev-suite/UI_PLANNING.md) | Phases, auto-updates, packaging |
| [AI_CHATBOT_INTEGRATION.md](./AI_CHATBOT_INTEGRATION.md) | Widget + custom chat checklists |
| [RAG_BEST_PRACTICES.md](./rag/RAG_BEST_PRACTICES.md) | RAG quick checklist (see table above) |
