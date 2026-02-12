# Debugger RAG Integration

The debugger integrates with RAG in two ways:

## 1. Suite RAG log

The debugger reads the AI Dev Suite's RAG log (`~/.config/ai-dev-suite/rag.log`) and surfaces it in the log selector (Ollama | A2A | RAG | Electron). This lets you see RAG/web research activity when troubleshooting "(no response)" or research failures.

## 2. RAG-style memory (Past fixes)

The debugger stores fix suggestions from qwen2.5-coder in `~/.config/ai-dev-suite/debugger_memory.md`. Past fixes are injected into the analysis prompt so the model can reuse prior solutions.

---

**RAG tool location:** The Python RAG tool (`rag.py`) lives in `ai-dev-suite/rag/`. See [doc/ai-dev-suite/rag/](../../doc/ai-dev-suite/rag/) for full RAG documentation.
