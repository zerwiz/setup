#!/usr/bin/env bash
# AI Dev Suite + Debugger – start both the Suite (chat, drive, etc.) and the Debugger (logs, status, fixes)
# Usage: ./start-ai-dev-suite-and-debugger.sh
# Force Ollama terminal: OLLAMA_TERMINAL=1 ./start-ai-dev-suite-and-debugger.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEBUGGER_PID=""

cleanup() {
  if [ -n "$DEBUGGER_PID" ] && kill -0 "$DEBUGGER_PID" 2>/dev/null; then
    echo "Stopping debugger..."
    kill "$DEBUGGER_PID" 2>/dev/null || true
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM

# Install RAG deps
if [ -f "$SCRIPT_DIR/ensure-rag-deps.sh" ]; then
  bash "$SCRIPT_DIR/ensure-rag-deps.sh" 2>/dev/null || true
fi

# Ollama: kill existing, then start fresh (GPU if installed; OLLAMA_GPU.md)
run_ollama_in_terminal() {
  local cmd="$1"
  local tmp
  tmp="$(mktemp)"
  printf '%s\n' "$cmd" > "$tmp"
  chmod +x "$tmp"
  if command -v gnome-terminal >/dev/null 2>&1; then
    gnome-terminal -- bash "$tmp"
  elif command -v xterm >/dev/null 2>&1; then
    xterm -e "bash $tmp; rm -f $tmp"
  elif command -v konsole >/dev/null 2>&1; then
    konsole -e bash "$tmp"
  elif command -v xfce4-terminal >/dev/null 2>&1; then
    xfce4-terminal -e "bash $tmp"
  else
    rm -f "$tmp"
    return 1
  fi
  (sleep 2; rm -f "$tmp") &
}

if command -v ollama >/dev/null 2>&1; then
  if ollama list >/dev/null 2>&1; then
    echo "Stopping existing Ollama..."
    pkill -x ollama 2>/dev/null || killall ollama 2>/dev/null || true
    sleep 2
  fi
  OLLAMA_NEED_START=false
  if ! ollama list >/dev/null 2>&1; then
    OLLAMA_NEED_START=true
  fi
  if [ "$OLLAMA_NEED_START" = true ]; then
    echo "Starting Ollama in a new terminal..."
    if run_ollama_in_terminal "ollama serve; echo ''; echo '--- Ollama exited. Press Enter to close.'; read"; then
      :
    else
      ollama serve >> /tmp/ollama.log 2>&1 &
    fi
    for i in $(seq 1 30); do
      if ollama list >/dev/null 2>&1; then
        echo "Ollama ready."
        break
      fi
      sleep 1
      [ $i -eq 30 ] && echo "Ollama not responding after 30s; continuing anyway."
    done
  elif [ -n "${OLLAMA_TERMINAL:-}" ]; then
    echo "Opening Ollama terminal (OLLAMA_TERMINAL=1)..."
    if [ -f /tmp/ollama.log ]; then
      run_ollama_in_terminal "tail -f /tmp/ollama.log; echo ''; echo 'Press Enter to close.'; read" || true
    else
      run_ollama_in_terminal "echo 'Ollama already running.'; echo 'Press Enter to close.'; read" || true
    fi
  fi
fi

# Free ports: Suite (5174), Debugger (5175), API (41434)
for port in 5174 5175 41434; do
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

# Start API
ELIXIR_DIR="$SCRIPT_DIR/ai-dev-suite/elixir_tui"
if [ -f "$ELIXIR_DIR/mix.exs" ]; then
  echo "Starting API (first run: mix compile may take 30–60s)..."
  echo "  Log: /tmp/ai-dev-suite-api.log"
  (cd "$ELIXIR_DIR" && mix run -e "AiDevSuiteTui.API.start()") >> /tmp/ai-dev-suite-api.log 2>&1 &
  for i in $(seq 1 120); do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:41434/api/ollama/models 2>/dev/null || echo "000")
    if [ "$code" = "200" ] || [ "$code" = "500" ]; then
      echo "API ready (HTTP $code)."
      break
    fi
    if [ $((i % 10)) -eq 0 ] && [ $i -lt 120 ]; then
      echo "  Still waiting... ($i s)"
    fi
    [ $i -eq 120 ] && echo "API not responding after 120s."
    sleep 1
  done
  export AI_DEV_SUITE_API_STARTED=1
fi

# Start A2A agent (Suite ↔ Debugger)
if [ -f "$SCRIPT_DIR/debugger/start-a2a.sh" ]; then
  if ! curl -s --max-time 1 http://localhost:41435/.well-known/agent-card.json >/dev/null 2>&1; then
    echo "Starting A2A agent (Suite ↔ Debugger)…"
    "$SCRIPT_DIR/debugger/start-a2a.sh" >> /tmp/ai-dev-suite-debug-a2a.log 2>&1 &
  fi
fi

# Start Debugger in background
DEBUGGER_APP="$SCRIPT_DIR/debugger/electron-app"
if [ -f "$DEBUGGER_APP/package.json" ]; then
  cd "$DEBUGGER_APP"
  [ ! -d "node_modules" ] && echo "Installing debugger deps..." && npm install 2>/dev/null
  echo "Starting Debugger (port 5175)..."
  npm run dev >> /tmp/ai-dev-suite-debugger.log 2>&1 &
  DEBUGGER_PID=$!
  sleep 2
  cd "$SCRIPT_DIR"
fi

# Suite Electron deps
cd "$SCRIPT_DIR/ai-dev-suite/electron_app"
if [ ! -d "node_modules/concurrently" ]; then
  echo "Installing Suite dependencies..."
  npm install 2>/dev/null
fi

echo ""
echo "Suite: http://localhost:5174  |  Debugger: http://localhost:5175"
echo "Closing Suite (Ctrl+C) will also stop the Debugger."
echo ""

# Run Suite in foreground (tee so debugger can read log)
npm run dev 2>&1 | tee /tmp/ai-dev-suite-electron.log
