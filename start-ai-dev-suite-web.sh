#!/usr/bin/env bash
# AI Dev Suite – API + Vite for browser. Open http://localhost:5174

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Kill any running Ollama, then start fresh (ensures GPU-capable binary if installed; see doc/ai-dev-suite/OLLAMA_GPU.md)
if command -v ollama >/dev/null 2>&1; then
  if ollama list >/dev/null 2>&1; then
    echo "Stopping existing Ollama..."
    pkill -x ollama 2>/dev/null || killall ollama 2>/dev/null || true
    sleep 2
  fi
  if ! ollama list >/dev/null 2>&1; then
    echo "Starting Ollama..."
    ollama serve >> /tmp/ollama.log 2>&1 &
    sleep 2
  fi
fi

# Install RAG deps (duckduckgo-search, trafilatura, etc.) for Internet/web search
if [ -f "$SCRIPT_DIR/ensure-rag-deps.sh" ]; then
  bash "$SCRIPT_DIR/ensure-rag-deps.sh" 2>/dev/null || true
fi
cd "$SCRIPT_DIR/ai-dev-suite"

# Free ports if in use (stale from previous run)
for port in 5174 41434; do
  if command -v lsof >/dev/null 2>&1; then
    pid=$(lsof -t -i:$port 2>/dev/null)
    if [ -n "$pid" ]; then
      echo "Port $port in use (PID $pid), stopping stale process..."
      kill $pid 2>/dev/null || true
      sleep 1
    fi
  elif command -v fuser >/dev/null 2>&1; then
    fuser -k ${port}/tcp 2>/dev/null || true
    sleep 1
  fi
done

cleanup() {
  echo "Stopping API..."
  kill $API_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "Starting API..."
cd elixir_tui
mix run -e "AiDevSuiteTui.API.start()" &
API_PID=$!
cd ..

sleep 3

echo "Starting Vite..."
cd electron_app
[ ! -d "node_modules/vite" ] && npm install
npm run dev:vite
