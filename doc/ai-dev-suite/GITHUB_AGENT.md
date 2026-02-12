# GitHub Agent – AI Reads Your Repos for Development Help

Investigation document for adding functionality so the AI agent can read the user's GitHub repositories and assist with development questions, suggestions, and code understanding.

---

## Purpose

Enable the AI Dev Suite chat agent to:

- **Answer questions** about the user's GitHub repos (“How does auth work in this project?”, “Where is the API client defined?”)
- **Suggest improvements** based on actual code (“Consider adding error handling here”, “This could use a type hint”)
- **Provide context-aware development help** (“In your frontend, the submit handler is in `ContactForm.tsx`”)

The agent would fetch, index, or query repository contents and use them as context when the user asks development-related questions.

---

## Approaches (Investigated)

### 1. GitHub REST API – Direct File Access

**What:** Use [GitHub Contents API](https://docs.github.com/en/rest/repos/contents) and [Git Trees API](https://docs.github.com/en/rest/git/trees) to read repo contents without cloning.

| Endpoint | Use |
|---------|-----|
| `GET /repos/{owner}/{repo}/contents/{path}` | File or directory contents (base64-encoded for files) |
| `GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1` | Full recursive tree |
| `GET /repos/{owner}/{repo}/readme` | Root README |
| Media type `application/vnd.github.raw` | Raw file content (no base64) |

**Auth:** Personal access token (PAT) with **Contents: read**. Fine-grained PAT scoped to specific repos recommended.

**Limits:**

- Files &gt; 100 MB: not supported
- Files 1–100 MB: raw/object media types only
- Directory listing: max 1,000 items per request; use Trees API for larger dirs

**Pros:** No local clone; works for public and private repos; real-time content; fits API-based architecture.

**Cons:** Rate limits (5,000 req/h authenticated); need to handle pagination and large trees; token security.

---

### 2. RAG – Index Repo into Vector Store

**What:** Clone or fetch repo contents, chunk code (e.g. with CodeSplitter, tiktoken), embed chunks, store in ChromaDB/Elasticsearch; use RAG retrieval when user asks questions.

**Reference projects:**

- [GitHub Assistant (Elasticsearch + LlamaIndex)](https://www.elastic.co/search-labs/blog/github-rag-elasticsearch) – clones repo, chunks with CodeSplitter, embeds with text-embedding-3-large
- [RepoSearchRAG](https://github.com/MarkoKolarski/RepoSearchRAG) – LLM listwise reranker for GitHub code
- Existing `tools/rag`: hybrid BM25+vector, reranker, incremental index – could be extended for GitHub sources

**Pros:** Semantic search; handles “find code like X”; works with existing RAG pipeline; good for large codebases.

**Cons:** Index build time; need clone or API-based fetch; reindex on repo updates.

---

### 3. Hybrid – API Fetch + RAG

**What:** Fetch repo contents via GitHub API (or clone for large repos), convert to text, add to knowledge base or RAG index. Chat uses existing KB/Drive flow with “GitHub repo” as a source.

**Pros:** Reuses Drive/KB architecture; user picks which repos to add; incremental indexing possible.

**Cons:** Same token/rate-limit and security considerations as API approach.

---

### 4. Cursor / GitHub Copilot (Reference)

**Cursor:** Native GitHub integration with codebase indexing (vector graph). `GET /v0/repositories` in Background Agents API. Requires Cursor API key.

**GitHub Copilot Agent:** Autonomous agent on GitHub; can work on issues and PRs; requires Copilot Pro/Business/Enterprise.

**Takeaway:** These are closed ecosystems. For AI Dev Suite, a custom integration via GitHub API + RAG is more appropriate.

---

## Implementation Sketch for AI Dev Suite

### Option A: GitHub as Knowledge Base Source

1. **Settings / new “GitHub” section:** User connects GitHub account (PAT stored in config, never logged).
2. **Add repo to KB:** User selects `owner/repo` (and optionally branch/path). System fetches via API or clones, converts to text, indexes into existing RAG/KB (like Drive).
3. **Chat:** User chooses a KB that includes GitHub repo context. Agent answers using retrieved chunks.

### Option B: On-Demand Repo Context

1. **Chat context:** User types `@repo:owner/name` or selects “Add repo to this chat” from a list of their repos.
2. **Fetch:** API retrieves key files (README, main entry points, selected paths) or full tree.
3. **Inject:** Fetched content is added to the chat context (or a small RAG index) for that conversation.

### Option C: Dedicated “GitHub” Screen

- List connected repos
- Add/remove repos
- Trigger index/refresh
- Per-repo: last indexed, branch, included paths
- Link to Chat: “Use this repo in chat”

---

## Technical Building Blocks

### 1. GitHub Token Storage

- Store in `~/.config/ai-dev-suite/` (e.g. `github_config.json`) with restricted permissions
- Never log or expose token
- Support optional `GITHUB_TOKEN` env override for CI/automation

### 2. API Client (Elixir)

```elixir
# GET /repos/owner/repo/contents?ref=main
# Accept: application/vnd.github.raw
# Authorization: Bearer TOKEN
```

- Use `Req` or `HTTPoison`
- Handle 403 (rate limit, no access), 404, pagination
- Optional: GitHub GraphQL for more efficient batch queries

### 3. Repo Traversal

- Start at root or user-specified path
- For directories: list contents, recurse (respect 1,000-file limit; use Trees API if needed)
- Skip: `.git/`, `node_modules/`, `__pycache__/`, large binaries
- Include: `.py`, `.ts`, `.tsx`, `.js`, `.ex`, `.md`, `.yaml`, `.json`, etc. (configurable)

### 4. Integration with Chat

- **RAG path:** Add GitHub-fetched content to `tools/rag` index or to Drive KB
- **Context path:** Fetch on demand, prepend to system/user message for chat
- Existing `knowledge_bases` and `drive` logic can be extended to support “GitHub source”

---

## Security & Permissions

| Concern | Recommendation |
|---------|----------------|
| Token storage | Encrypted or file permissions `600`; never in git |
| Token scope | Fine-grained PAT with **Contents: read** only; restrict to needed repos |
| Rate limits | Cache responses; batch requests; respect `Retry-After` |
| Private repos | Require PAT with repo access; document clearly |

---

## Suggested API Endpoints (AI Dev Suite)

| Endpoint | Purpose |
|---------|---------|
| `GET /api/github/repos` | List repos user has access to (optional; requires `repo` scope or GraphQL) |
| `POST /api/github/fetch` | Fetch repo contents: `{ owner, repo, branch?, path?, max_files? }` → returns file list + contents |
| `POST /api/github/add-to-kb` | Fetch repo and add to knowledge base `{ owner, repo, kb_name, branch?, include_paths? }` |
| `GET /api/github/status` | Whether GitHub is configured (token present, no token, invalid) |

---

## References

- [GitHub REST API – Repository contents](https://docs.github.com/en/rest/repos/contents)
- [GitHub REST API – Git trees](https://docs.github.com/en/rest/git/trees)
- [Fine-grained PAT – Contents permission](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)
- [GitHub Assistant RAG (Elasticsearch)](https://www.elastic.co/search-labs/blog/github-rag-elasticsearch)
- [Cursor GitHub Integration](https://docs.cursor.com/en/integrations/github)

---

## Next Steps

1. Decide: Option A (KB source), B (on-demand), or C (dedicated screen)—or phased (A first, then C).
2. Implement GitHub API client in Elixir (with token from config).
3. Add `POST /api/github/fetch` and wire to existing KB or a new “GitHub source” type.
4. Update Chat UI to allow selecting “GitHub repo” as context.
5. Document token setup in START.md and a `GITHUB_SETUP.md` (or section in STORAGE.md).
