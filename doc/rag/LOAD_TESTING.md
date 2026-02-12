# RAG Load and Failure Testing

Establish a performance baseline and verify behavior under load.

---

## Prerequisites

- Index with documents: `python rag.py index <files>`
- Ollama running
- (Optional) Redis for cache: `RAG_REDIS_URL=redis://localhost:6379`

---

## Load Test Script

Run from `tools/rag`:

```bash
./scripts/load-test.sh [concurrency] [queries] [query]
```

- `concurrency` – parallel workers (default: 5)
- `queries` – total queries (default: 20)
- `query` – question to ask (default: "What is RAG?")

**Example:**
```bash
cd tools/rag
./scripts/load-test.sh 5 20 "What is RAG in machine learning?"
```

---

## Interpreting Results

The script reports:
- Total time
- Success / failure count
- Min, max, mean latency (seconds)
- P95, P99 (if enough samples)

**Baseline targets (adjust for your hardware):**
- Mean latency < 5s (query with rerank)
- P95 < 10s
- 0% failure under normal load

---

## Failure Testing

1. **Ollama down:** Stop Ollama, run queries. Expect clean errors, no hangs.
2. **ChromaDB corrupt:** Remove index dir, run query. Expect clear "index empty" message.
3. **Network:** Disconnect, run `--web` research. Expect timeout/error, not crash.

---

## See Also

- [REINDEX_RUNBOOK.md](./REINDEX_RUNBOOK.md) – zero-downtime reindex
- [PRODUCTION_HARDENING.md](./PRODUCTION_HARDENING.md) – rate limit, Redis, alerting
