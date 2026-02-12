# How to Build a Really Good RAG System

A practical guide to building production-ready Retrieval-Augmented Generation (RAG) systems, based on research and best practices from 2024–2025.

## Contents

1. [Chunking](#1-chunking)  
2. [Embeddings](#2-embeddings)  
3. [Tags and Metadata for Context Mapping](#3-tags-and-metadata-for-context-mapping)  
4. [Indexing & Storage](#4-indexing--storage)  
5. [Retrieval](#5-retrieval)  
6. [Prompt Design](#6-prompt-design)  
7. [Evaluation](#7-evaluation)  
8. [Production Considerations](#8-production-considerations)  
9. [Implementation Plan](#9-implementation-plan)  
10. [Quick Checklist](#10-quick-checklist)  
11. [References](#11-references--further-reading)  
12. [Simple RAG (no vector DB)](#simple-rag-no-vector-db)  

---

## What RAG Does

RAG connects language models to your data. Instead of asking the model to answer from its training data alone:

1. **Retrieve** – Search your documents/knowledge base for relevant content  
2. **Augment** – Package that content with the user's query  
3. **Generate** – The model produces an answer grounded in that context  

**Benefits:** Reduces hallucinations by 60–70%, enables up-to-date and domain-specific answers, and keeps proprietary data private.

---

## Where RAG Systems Fail

Most failures come from **retrieval**, not from the LLM. Common issues:

- Chunks are too large → diffuse embeddings → imprecise matches  
- Embedding model doesn't fit the domain → poor semantic similarity  
- Similarity alone is used → no reranking, metadata, or hybrid search  
- Knowledge base becomes stale → outdated answers  
- No evaluation → no way to know if retrieval is good enough  

---

## 1. Chunking

Chunking is how you split documents into indexable units. It strongly affects retrieval quality.

### Strategies (from simple to advanced)

| Strategy | Pros | Cons | When to use |
|----------|------|------|-------------|
| **Fixed-size (char/token)** | Fast, simple | Can split mid-sentence | Prototypes only |
| **Recursive** | Keeps structure (para → sentence) | Needs separator config | General-purpose, production |
| **Semantic** | Highest accuracy, meaning-aware | Higher compute | Knowledge bases, technical docs |
| **Token-based** | Predictable API/token cost | Less flexible | Strict budget/limits |
| **Hybrid** (semantic + token cap) | Good balance | More complex | Complex, mixed-format docs |

### Recommended settings

- **Chunk size:** 256–512 tokens (~100–200 words). Smaller = more precise retrieval.
- **Overlap:** 10–20% (e.g., 50–100 tokens for 512-token chunks) to avoid losing context at boundaries.
- **Default:** 512 tokens, 20% overlap is a solid starting point.

### Decision guide

- **Highest accuracy** → Semantic chunking  
- **General production** → Recursive chunking (e.g. RecursiveCharacterTextSplitter)  
- **Tight token/cost limits** → Token-based chunking  

---

## 2. Embeddings

Embeddings turn text into vectors for similarity search. Model choice matters.

### Recommendations

- **General-purpose:** OpenAI embeddings, sentence-transformers (SBERT, all-MiniLM), E5/Instruct embeddings.
- **Domain-specific:** Models tuned for your domain (e.g. medical, legal, code) can outperform general ones by 20–40%.
- **Normalize** embeddings when your vector DB supports it.
- **Re-embed** when you change models; old and new embeddings are not comparable.

### Trade-offs

Better embeddings cost more compute but reduce downstream mistakes. For production, prefer better retrieval over cheaper but weaker embeddings.

---

## 3. Tags and Metadata for Context Mapping

Use tags and metadata so the model can map content to sources and understand structure. This improves retrieval, citation, and disambiguation.

### Why it matters

Without metadata, similar-looking chunks (e.g. two PDFs with tables) get confused. With document title, section, and file metadata, the model knows *where* information came from and can cite correctly.

### Best practices

| Technique | Purpose |
|-----------|---------|
| **Source tags** | `[file: notes.pdf]` `[source: 2024-Q3-report]` – provenance for each chunk |
| **Structure tags** | `[section: 2.1 Introduction]` `[h2: Pricing]` – hierarchy from headers |
| **Type tags** | `[type: pdf]` `[type: table]` – help model interpret content |
| **Metadata-as-text** | Prefix/suffix each chunk with `document_title: X\nfile_name: Y\npage: Z\n\ncontent` – simple and effective when no vector filtering |
| **Questions-answered** | LLM extracts "questions this excerpt can answer" per chunk – improves retrieval targeting |

### Recommended format for chunks

```
[file: path/to/doc.pdf] [type: pdf] [page: 3] [section: 2.1 Overview]
---
{chunk content}
```

Or for LLM consumption without vector DB:

```
--- document: 2024-report.pdf | section: Executive Summary | page: 1 ---
{content}
```

### Structure-aware splitting

- **HTML/Markdown:** Split at `h1`, `h2`, `h3` boundaries; attach header text as metadata to each chunk.
- **PDF:** Use page boundaries when available; preserve section headings from the first line of each page.
- **Tables:** Tag as `[type: table]` so the model knows to treat content as structured data.

### Operational rules

- Keep metadata consistent across similar documents (same schema).
- Include enough context in tags for the model to disambiguate (e.g. company name, year, section).
- When passing to the LLM, put metadata *before* content so the model sees provenance first.

---

## 4. Indexing & Storage

### Document conversion (PDF, DOCX → text)

Before chunking, convert binary formats to plain text so the model can read them:

- **PDF:** `pdftotext` (poppler-utils), `-layout` to preserve structure.
- **DOCX:** `pandoc -t plain`, or extract from the docx ZIP/XML.
- **Plain text / Markdown:** Use as-is. Add `[file:]` `[type:]` tags when storing.

### Vector DBs and indexes

- **Vector DBs:** Pinecone, Weaviate, Chroma, Qdrant, pgvector, FAISS.
- **Index types:** HNSW for low latency and high recall; IVF-PQ (e.g. FAISS) for scale/cost.
- **Metadata:** Attach source, date, section, category so you can filter before or after retrieval.
- **Freshness:** Use incremental updates where possible; plan zero-downtime reindexing for batch updates.

---

## 5. Retrieval

### Vector similarity alone is not enough

- Add **reranking:** retrieve top-k (e.g. 20), rerank with a cross-encoder or dedicated reranker (e.g. ColBERT, Cohere ReRank). Improves precision with limited extra cost.
- Add **hybrid search:** BM25 (keyword) + dense (vector). Helps exact terms and semantic matches; reported 15–25% improvement over vector-only.
- Use **metadata filtering:** restrict by date, category, source before or after similarity search.
- Consider **query expansion:** rephrase or expand the query for better recall (e.g. synonyms, related questions).

### Retrieval depth

Balance recall vs latency and cost. Start with top-5 to top-10, rerank, then pass top-3 to top-5 to the LLM. Adjust based on your context window and task.

---

## 6. Prompt Design

### Structure

Use a layered prompt:

1. **System** – Role, constraints, how to use context  
2. **Task** – What to do  
3. **Context** – Retrieved documents (numbered or labeled)  
4. **Query** – User question  

### Important instructions

- *"Answer only from the context below."*  
- *"Cite the source (e.g. [1]) for each factual claim."*  
- *"If the context does not contain the answer, say so. Do not guess."*  

### Context formatting

- Use short, structured blocks (bullet points, summaries) when possible.  
- Prefer concise context over dumping full documents.  
- Add source IDs for citations.  

### Safety

- Add guardrails against prompt injection (e.g. trying to override "ignore previous instructions").  
- Ensure citations and provenance are visible to users.  

---

## 7. Evaluation

### What to measure

| Metric | Purpose |
|--------|--------|
| **Context relevance** | Does the retrieved context match the query? |
| **Answer faithfulness** | Is the answer supported by the context? |
| **Answer relevance** | Does the answer address the query? |
| **Recall@k** | Are the right documents in the top k? |
| **Precision@k** | How many of the top k are actually relevant? |
| **Latency** | End-to-end response time |

### Frameworks and approaches

- **ARES** – Automates RAG evaluation for context relevance, faithfulness, relevance.  
- **RAGTruth** – Hallucination corpus and evaluation.  
- **QAS** – Query-attributed score (grounding, retrieval coverage, faithfulness, efficiency).  

### Benchmarking

Benchmark different combinations of:

- Chunk size and overlap  
- Embedding model  
- Retrieval strategy (vector, hybrid, reranking)  
- Prompt variants  
- LLM size  

Tune based on real retrieval quality, not theory alone.

---

## 8. Production Considerations

### Freshness

- Plan incremental indexing for new and updated documents.
- Use batch reindexing at off-peak times; prefer zero-downtime where supported.
- Version documents so you know what is currently indexed.

### Observability

- Log retrieval inputs/outputs, latency, token use.
- Monitor recall, precision, and user satisfaction.
- Cache frequent or repeated queries when appropriate.

### Failure modes

- Stale context  
- Contradictory documents  
- Context too long for the model  
- No relevant documents found  

Define fallbacks (e.g. "no answer", "expand search", "use web") and test them.

---

## 9. Implementation Plan

A phased plan to build a RAG system from scratch.

### Phase 1: MVP (1–2 weeks)

**Goal:** End-to-end flow with minimal complexity.

| Step | Task | Deliverable |
|------|------|-------------|
| 1 | Define use case and document types (PDF, markdown, DOCX, etc.) | Scope document |
| 2 | Set up document loader + conversion (pdftotext, pandoc for DOCX) | Raw text from PDF/DOCX |
| 3 | Chunk with fixed size (512 chars) + 10% overlap | Chunks with IDs |
| 4 | Pick an embedding model (OpenAI or sentence-transformers) | Embeddings per chunk |
| 5 | Choose a vector DB (Chroma, Pinecone, or pgvector) | Indexed chunks |
| 6 | Implement query → embed → similarity search → top-k | Retrieval pipeline |
| 7 | Build prompt: system + context + query | Basic RAG response |
| 8 | Connect to an LLM (OpenAI, Ollama, etc.) | Working MVP |

**Success criteria:** User asks a question; system returns an answer grounded in your docs.

---

### Phase 2: Improve Retrieval (2–3 weeks)

**Goal:** Better chunks, embeddings, and retrieval.

| Step | Task | Deliverable |
|------|------|-------------|
| 1 | Replace fixed chunking with recursive (e.g. by paragraph/sentence) | Improved chunks |
| 2 | Tune chunk size (256–512 tokens) and overlap (10–20%) | Tuned chunk config |
| 3 | Evaluate embedding models; consider domain-specific if needed | Chosen embedding model |
| 4 | Add tags/metadata to chunks: `[file:]` `[type:]` `[section:]` | Metadata-enriched index |
| 5 | Implement hybrid search (BM25 + vector) | Hybrid retrieval |
| 6 | Add reranker for top-10 → top-3 | Reranked results |
| 7 | Add metadata filters (e.g. date, source) | Filtered retrieval |

**Success criteria:** Retrieved chunks are consistently relevant for a test set of queries.

---

### Phase 3: Prompt & Generation (1 week)

**Goal:** Reliable, cited answers.

| Step | Task | Deliverable |
|------|------|-------------|
| 1 | Refine system prompt (role, constraints, citation rules) | Final system prompt |
| 2 | Format context with source IDs (e.g. [1], [2]) | Structured context block |
| 3 | Add instructions: "Answer only from context"; "Cite sources"; "Say if unknown" | Prompt template |
| 4 | Implement citation parsing from model output | Extracted citations |
| 5 | Add fallback when no relevant docs found | Graceful "no answer" path |

**Success criteria:** Answers cite sources; model refuses when context lacks the answer.

---

### Phase 4: Evaluation & Iteration (ongoing)

**Goal:** Measure and improve quality.

| Step | Task | Deliverable |
|------|------|-------------|
| 1 | Create eval set (20–50 Q&A pairs from your docs) | Eval dataset |
| 2 | Measure context relevance, faithfulness, answer relevance | Baseline metrics |
| 3 | A/B test: chunk sizes, retrieval depth, prompt variants | Comparison results |
| 4 | Set up logging (queries, retrieved docs, latency) | Observability |
| 5 | Define alerting for latency and error rate | Monitoring |

**Success criteria:** Clear metrics and a process to improve them.

---

### Phase 5: Production Hardening (2–3 weeks)

**Goal:** Ready for production traffic.

| Step | Task | Deliverable |
|------|------|-------------|
| 1 | Implement incremental indexing for new/updated docs | Live indexing |
| 2 | Plan zero-downtime reindexing for batch updates | Reindex runbook |
| 3 | Add query caching (Redis or in-memory) | Caching layer |
| 4 | Add rate limiting and guardrails | Security controls |
| 5 | Load and failure testing | Performance baseline |
| 6 | Documentation and runbooks | Ops docs |

**Success criteria:** System handles updates, scale, and failures without manual intervention.

---

### Timeline summary

| Phase | Duration | Focus |
|-------|----------|--------|
| 1 – MVP | 1–2 weeks | End-to-end working |
| 2 – Retrieval | 2–3 weeks | Chunking, embeddings, hybrid + rerank |
| 3 – Prompt | 1 week | Citations, constraints |
| 4 – Evaluation | Ongoing | Metrics, iteration |
| 5 – Production | 2–3 weeks | Freshness, scale, reliability |

**Total:** Roughly 6–9 weeks to a production-ready RAG system.

---

## 10. Quick Checklist

- [ ] Chunk size 256–512 tokens, 10–20% overlap  
- [ ] Tags/metadata per chunk: [file:] [type:] [section:] for context mapping  
- [ ] Chunking strategy: recursive for general use, semantic for high accuracy  
- [ ] Embedding model suitable for your domain  
- [ ] Hybrid retrieval (BM25 + vector) where useful  
- [ ] Reranking for top results  
- [ ] Metadata filtering on date, source, category  
- [ ] Prompt with clear context-use and citation rules  
- [ ] Evaluation metrics (relevance, faithfulness, recall, latency)  
- [ ] Incremental indexing and freshness strategy  
- [ ] Observability and caching  

---

## 11. References & Further Reading

- *Searching for Best Practices in Retrieval-Augmented Generation* (EMNLP 2024)  
- *Enhancing Retrieval-Augmented Generation: A Study of Best Practices* (COLING 2025)  
- *RAG Implementation Guide: Embedding Models, Chunking Strategies, and Reranking* (Mayhemcode 2025)  
- LangChain: *A Chunk by Any Other Name* – structured splitting, HTML header metadata  
- LlamaIndex: Metadata extraction (title, keywords, questions-answered)  
- ARES: Automated RAG evaluation framework  
- AWS: Writing best practices for RAG optimization  

---

## Simple RAG (no vector DB)

For local or small-scale setups, you can skip the vector DB:

1. Convert documents to text (pdftotext, pandoc).  
2. Add metadata headers: `[file: X] [type: pdf] [source: X]` before each document's content.  
3. Load all (or a filtered subset) into the system prompt.  
4. Rely on the model's context window to find relevant passages.

**Pros:** No embeddings, no index, minimal infra.  
**Cons:** Limited by context length; no semantic retrieval over large corpora.

---

*Last updated: February 2025*
