#!/usr/bin/env bash
# AI Dev Suite – API only. http://localhost:41434

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start Ollama if available and not already running
if command -v ollama >/dev/null 2>&1; then
  if ! ollama list >/dev/null 2>&1; then
    echo "Starting Ollama..."
    ollama serve >> /tmp/ollama.log 2>&1 &
    sleep 2
  fi
fi

# Free port 41434 if in use (stale API from previous run)
if command -v lsof >/dev/null 2>&1; then
  pid=$(lsof -t -i:41434 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Port 41434 in use (PID $pid), stopping stale process..."
    kill $pid 2>/dev/null || true
    sleep 1
  fi
elif command -v fuser >/dev/null 2>&1; then
  fuser -k 41434/tcp 2>/dev/null || true
  sleep 1
fi

# Install RAG deps (duckduckgo-search, trafilatura, etc.) for Internet/web search
if [ -f "$SCRIPT_DIR/ensure-rag-deps.sh" ]; then
  bash "$SCRIPT_DIR/ensure-rag-deps.sh" 2>/dev/null || true
fi
cd "$SCRIPT_DIR/ai-dev-suite/elixir_tui"
mix run -e "AiDevSuiteTui.API.start()"
