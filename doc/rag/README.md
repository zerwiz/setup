# RAG – Retrieval-Augmented Generation

Full implementation per [RAG_BEST_PRACTICES.md](./RAG_BEST_PRACTICES.md) (Phases 1–5).

## Purpose

Index your documents (PDF, DOCX, TXT, MD) and answer questions using Ollama. Uses Chroma for vector storage, hybrid BM25+vector retrieval, and Ollama for embeddings + generation.

## Requirements

- Python 3.10+
- Ollama running locally (for embeddings and chat)
- Embedding model: `nomic-embed-text` or `all-minilm` (run `ollama pull nomic-embed-text`)

## Setup

```bash
cd tools/rag
pip install -r requirements.txt   # or: python3 -m pip install -r requirements.txt
ollama pull nomic-embed-text       # or: ollama pull all-minilm
ollama serve                      # if not already running
```

## Usage

### Index documents

```bash
python rag.py index doc1.pdf doc2.docx notes.md
# Incremental (only reindex changed files):
python rag.py index docs/ --incremental
```

Documents are chunked recursively (512 chars, 20% overlap), tagged with `[file:]` `[type:]` `[source:]` `[page:]` `[section:]`, embedded via Ollama, and stored in `~/.config/ai-dev-suite/rag_index/`.

### Query

```bash
python rag.py query "What is the main topic of the documents?"
python rag.py query --citations   # Print extracted citations after answer
# Include web search for research (when index is empty or for current info):
python rag.py query "Latest news on AI" --web
# Metadata filters:
python rag.py query "price" --filter-source /path/to/report.pdf --filter-type pdf
```

### Research (web search + AI)

Use when you need internet access for research. Searches the web and optionally merges with your indexed documents.

```bash
python rag.py research "What is RAG in machine learning?"
# Or from AI Dev Suite chat: /research What is RAG?
```

### Evaluation

```bash
# Create eval.jsonl: {"question": "...", "expected": "..."} per line
python rag.py eval --eval-file eval.jsonl
# Results written to <index-dir>/eval_results.json with metrics
```

## Options

- `--index-dir` – Chroma index path (default: `~/.config/ai-dev-suite/rag_index`)
- `--model` – Ollama model for generation (default: `llama3.2`)
- `--embed-model` – Ollama embedding model (default: `nomic-embed-text`)
- `--incremental` – Only reindex changed files (uses file hash manifest)
- `--no-cache` – Disable query cache (5 min TTL)
- `--filter-source` – Metadata filter: source path prefix
- `--filter-type` – Metadata filter: file type (pdf, docx, etc.)
- `--citations` – Print extracted citations after answer
- `--web` – Include web search results (query command)

## Documentation

- **[FUNCTIONS.md](./FUNCTIONS.md)** – Full reference of all functions, constants, and commands.
- [RAG_BEST_PRACTICES.md](./RAG_BEST_PRACTICES.md) – Production RAG design guide.

## Implementation status

| Phase | Status |
|-------|--------|
| 1 – MVP | Done: loader, chunker, Chroma, Ollama embed+chat |
| 2 – Retrieval | Done: recursive chunking, hybrid BM25+vector, RRF fusion, metadata filters |
| 3 – Prompt | Done: citation rules, guardrails, fallback, citation parsing |
| 4 – Evaluation | Done: eval command, hybrid retrieval, basic metrics |
| 5 – Production | Done: incremental indexing, query caching, logging |
