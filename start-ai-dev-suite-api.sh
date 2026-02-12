#!/usr/bin/env bash
# AI Dev Suite – API only. http://localhost:41434

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Install RAG deps (duckduckgo-search, trafilatura, etc.) for Internet/web search
if [ -f "$SCRIPT_DIR/ensure-rag-deps.sh" ]; then
  bash "$SCRIPT_DIR/ensure-rag-deps.sh" 2>/dev/null || true
fi
cd "$SCRIPT_DIR/ai-dev-suite/elixir_tui"
mix run -e "AiDevSuiteTui.API.start()"
