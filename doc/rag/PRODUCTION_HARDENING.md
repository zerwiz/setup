# RAG Production Hardening

Runbook for rate limiting, caching, alerting, and load testing.

---

## Rate Limiting

**Scope:** `/api/research` in the AI Dev Suite Elixir API.

**Config:**
- `RAG_RATE_LIMIT_PER_MIN` – requests per IP per minute (default: 60). Set to 0 to disable.

**Example:**
```bash
RAG_RATE_LIMIT_PER_MIN=30 ./start-ai-dev-suite-api.sh
```

When exceeded, the API returns `429 Rate limit exceeded`.

---

## Redis Caching

**Scope:** RAG query/research cache (replaces in-memory dict for multi-process use).

**Config:**
- `RAG_REDIS_URL` – Redis connection URL (e.g. `redis://localhost:6379/0`)

**Setup:**
```bash
pip install redis
export RAG_REDIS_URL=redis://localhost:6379/0
python rag.py query "your question"
```

If Redis is unavailable, falls back to in-memory cache. TTL remains 5 minutes.

---

## Alerting

**Scope:** RAG logging; alerts on high latency or errors.

**Config:**
- `RAG_ALERT_WEBHOOK` – URL to POST alert payloads (JSON)
- `RAG_ALERT_LATENCY_MS` – latency threshold (ms). Alerts when exceeded.

**Example:**
```bash
export RAG_ALERT_WEBHOOK=https://your-webhook.example/alert
export RAG_ALERT_LATENCY_MS=10000
python rag.py query "question"
```

**Payload:**
```json
{"type": "high_latency", "event": "query", "latency_ms": 12000, "query": "..."}
{"type": "error", "event": "web_search_error", "error": "..."}
```

---

## Load and Failure Testing

See [LOAD_TESTING.md](./LOAD_TESTING.md) for the load-test script and baseline procedure.
