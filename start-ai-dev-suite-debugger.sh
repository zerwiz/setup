#!/usr/bin/env bash
# AI Dev Suite – Debugger
# Starts API + Ollama (if needed), then the debugger Electron UI.
# Usage: ./start-ai-dev-suite-debugger.sh
# With A2A agent: DEBUG=1 ./start-ai-dev-suite-debugger.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start Ollama if available and not already running
if command -v ollama >/dev/null 2>&1; then
  if ! ollama list >/dev/null 2>&1; then
    echo "Starting Ollama..."
    ollama serve >> /tmp/ollama.log 2>&1 &
    for i in $(seq 1 30); do
      if ollama list >/dev/null 2>&1; then
        echo "Ollama ready."
        break
      fi
      sleep 1
      [ $i -eq 30 ] && echo "Ollama not responding after 30s; continuing anyway."
    done
  fi
fi

# Start API in background if not already running (debugger needs it for test chat + logs)
ELIXIR_DIR="$SCRIPT_DIR/ai-dev-suite/elixir_tui"
if [ -f "$ELIXIR_DIR/mix.exs" ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 1 http://localhost:41434/api/ollama/models 2>/dev/null || echo "000")
  if [ "$code" != "200" ] && [ "$code" != "500" ]; then
    echo "Starting API (first run: mix compile may take 30–60s)..."
    echo "  Log: /tmp/ai-dev-suite-api.log"
    (cd "$ELIXIR_DIR" && mix run -e "AiDevSuiteTui.API.start()") >> /tmp/ai-dev-suite-api.log 2>&1 &
    for i in $(seq 1 120); do
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://localhost:41434/api/ollama/models 2>/dev/null || echo "000")
      if [ "$code" = "200" ] || [ "$code" = "500" ]; then
        echo "API ready (HTTP $code)."
        break
      fi
      if [ $((i % 10)) -eq 0 ] && [ $i -lt 120 ]; then
        echo "  Still waiting... ($i s)"
      fi
      [ $i -eq 120 ] && echo "API not responding after 120s. Run ./start-ai-dev-suite-api.sh in another terminal."
      sleep 1
    done
  fi
fi

# Optional: A2A agent (DEBUG=1)
if [ -n "${DEBUG:-}" ] && [ -f "$SCRIPT_DIR/debugger/start-a2a.sh" ]; then
  echo "Starting A2A agent (DEBUG=1)..."
  "$SCRIPT_DIR/debugger/start-a2a.sh" >> /tmp/ai-dev-suite-debug-a2a.log 2>&1 &
fi

# Start debugger UI
APP_DIR="$SCRIPT_DIR/debugger/electron-app"
if [ ! -f "$APP_DIR/package.json" ]; then
  echo "Error: debugger electron-app not found at $APP_DIR"
  exit 1
fi

cd "$APP_DIR"
if [ ! -d "node_modules" ]; then
  echo "Installing debugger UI dependencies..."
  npm install
fi

# Free port 5175 if in use (stale debugger from previous run)
if command -v lsof >/dev/null 2>&1; then
  pid=$(lsof -t -i:5175 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Port 5175 in use (PID $pid), stopping stale process..."
    kill $pid 2>/dev/null || true
    sleep 1
  fi
elif command -v fuser >/dev/null 2>&1; then
  fuser -k 5175/tcp 2>/dev/null || true
  sleep 1
fi

npm run dev
