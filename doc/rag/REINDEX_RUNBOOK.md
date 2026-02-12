# Zero-Downtime Reindex Runbook

Procedure for batch reindexing the RAG index without taking queries offline.

**Audience:** Operators running `tools/rag/rag.py` with ChromaDB.

**Use when:** You need to reindex all documents (new chunk strategy, embedding model, or bulk content changes) while keeping the current index available for queries until the new one is ready.

---

## Overview

The RAG tool uses ChromaDB with a single collection `rag_docs` in `~/.config/ai-dev-suite/rag_index`. To avoid downtime:

1. Build the new index in a **staging directory**
2. When ready, swap the live directory with the staging one
3. Queries continue against the old index until swap; after swap, they use the new index

---

## Prerequisites

- Python environment with RAG dependencies (`chromadb`, `pypdf`, `docx`, etc.)
- Ollama running with the embedding model (default: `nomic-embed-text`)
- List of document paths or a directory to index

---

## Procedure

### Step 1: Build the new index in staging

```bash
# Default index dir: ~/.config/ai-dev-suite/rag_index
# Staging dir for this run:
STAGING_DIR=~/.config/ai-dev-suite/rag_index_staging

# Create staging dir
mkdir -p "$STAGING_DIR"

# Index all documents into staging (not the live index)
python tools/rag/rag.py index \
  /path/to/doc1.pdf \
  /path/to/doc2.docx \
  /path/to/docs_dir/ \
  --index-dir "$STAGING_DIR"
```

For incremental runs on a large corpus, add `--incremental` so only changed files are re-embedded:

```bash
python tools/rag/rag.py index /path/to/docs/ --index-dir "$STAGING_DIR" --incremental
```

### Step 2: Validate the staging index

```bash
# Quick query to confirm the index works
python tools/rag/rag.py query "test query" --index-dir "$STAGING_DIR"
```

Check that results and citations look correct. Run `eval` if you have a test set:

```bash
python tools/rag/rag.py eval --index-dir "$STAGING_DIR" --eval-file eval.jsonl
```

### Step 3: Swap live and staging (atomic replace)

```bash
INDEX_DIR=~/.config/ai-dev-suite/rag_index
STAGING_DIR=~/.config/ai-dev-suite/rag_index_staging

# Backup current live index (optional but recommended)
mv "$INDEX_DIR" "${INDEX_DIR}.bak"

# Promote staging to live
mv "$STAGING_DIR" "$INDEX_DIR"
```

Queries that were using the old index will continue until they reconnect; new connections use the new index. ChromaDB opens the index at query time, so the swap is effective for the next query.

### Step 4: Optional cleanup

```bash
# Remove backup if the new index is stable
rm -rf ~/.config/ai-dev-suite/rag_index.bak
```

---

## Alternative: In-place incremental

If a full rebuild is not needed, use incremental indexing against the live index:

```bash
python tools/rag/rag.py index /path/to/docs/ --incremental
```

This updates only changed files. Deleted files remain in the index until a full reindex.

---

## Rollback

If the new index misbehaves after swap:

```bash
INDEX_DIR=~/.config/ai-dev-suite/rag_index
BACKUP_DIR=~/.config/ai-dev-suite/rag_index.bak

mv "$INDEX_DIR" "${INDEX_DIR}.failed"
mv "$BACKUP_DIR" "$INDEX_DIR"
```

---

## Checklist

- [ ] Staging directory created
- [ ] All documents indexed into staging
- [ ] Staging index validated (query + optional eval)
- [ ] Live index backed up (or noted for rollback)
- [ ] Staging promoted to live
- [ ] Post-swap smoke test
- [ ] Backup removed when stable (or kept for rollback window)

---

## See also

- [RAG_BEST_PRACTICES.md](./RAG_BEST_PRACTICES.md) – Production considerations
- [tools/rag/rag.py](../../rag/rag.py) – Implementation
- [tools/rag/README.md](../../rag/README.md) – Quick start
