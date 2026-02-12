#!/usr/bin/env bash
# AI Dev Suite – Electron desktop app
# If chat fails: run ./start-ai-dev-suite-api.sh in another terminal first, then:
#   cd ai-dev-suite/electron_app && AI_DEV_SUITE_API_STARTED=1 npm run dev
# If no Ollama terminal opens: see doc/ai-dev-suite/OLLAMA_TERMINAL.md
# Force Ollama terminal: OLLAMA_TERMINAL=1 ./start-ai-dev-suite-electron.sh
# Debug mode (observes API/Ollama logs + A2A agent): DEBUG=1 ./start-ai-dev-suite-electron.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Install RAG deps (duckduckgo-search, trafilatura, etc.) for Internet/web search
if [ -f "$SCRIPT_DIR/ensure-rag-deps.sh" ]; then
  bash "$SCRIPT_DIR/ensure-rag-deps.sh" 2>/dev/null || true
fi

# Start Ollama if available and not already running
# When starting, open a visible terminal so you can see Ollama output (helps debug "(no response)")
# OLLAMA_TERMINAL=1 forces opening a terminal even when Ollama is already running (shows tail -f log)
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
  (sleep 2; rm -f "$tmp") &  # terminal runs async; delay rm
}
if command -v ollama >/dev/null 2>&1; then
  OLLAMA_NEED_START=false
  if ! ollama list >/dev/null 2>&1; then
    OLLAMA_NEED_START=true
  fi
  if [ "$OLLAMA_NEED_START" = true ]; then
    echo "Starting Ollama in a new terminal (you can watch its output there)..."
    if run_ollama_in_terminal "ollama serve; echo ''; echo '--- Ollama exited. Press Enter to close.'; read"; then
      :
    else
      echo "  No terminal emulator found (gnome-terminal, xterm, konsole, xfce4-terminal). Starting in background."
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
      _ollama_cmd="echo 'Ollama already running. Tailing log:'; echo ''; tail -f /tmp/ollama.log"
    else
      _ollama_cmd="echo 'Ollama already running (started elsewhere).'; echo 'No /tmp/ollama.log. Run ollama serve in another terminal to see output.'; echo ''; echo 'Press Enter to close.'; read"
    fi
    if run_ollama_in_terminal "$_ollama_cmd"; then
      :
    else
      echo "  No terminal emulator found. Log: tail -f /tmp/ollama.log"
    fi
  fi
fi

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

# Start API in background first (mix compile can take 30+ s on first run)
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
    [ $i -eq 120 ] && echo "API not responding after 120s. Run manually: ./start-ai-dev-suite-api.sh"
    sleep 1
  done
  export AI_DEV_SUITE_API_STARTED=1
fi

cd "$SCRIPT_DIR/ai-dev-suite/electron_app"

# Ensure npm deps installed (concurrently, electron, etc.)
if [ ! -d "node_modules/concurrently" ]; then
  echo "Installing Electron app dependencies..."
  npm install
fi

# A2A debug agent: enables Suite ↔ Debugger communication ("Get debug help" in Chat)
if [ -f "$SCRIPT_DIR/debugger/start-a2a.sh" ]; then
  # Only start if not already running (e.g. from DEBUG=1)
  if ! curl -s --max-time 1 http://localhost:41435/.well-known/agent-card.json >/dev/null 2>&1; then
    echo "Starting A2A debug agent (Suite ↔ Debugger)…"
    "$SCRIPT_DIR/debugger/start-a2a.sh" >> /tmp/ai-dev-suite-debug-a2a.log 2>&1 &
  fi
fi

# Debug mode: open observer terminal (tails API + Ollama logs, health checks, test chat)
if [ -n "${DEBUG:-}" ]; then
  echo "Starting debug observer in new terminal (DEBUG=1)..."
  DEBUG_SCRIPT="$SCRIPT_DIR/debugger/observer.sh"
  if [ -f "$DEBUG_SCRIPT" ]; then
    run_ollama_in_terminal "bash $DEBUG_SCRIPT" || \
      echo "  Run manually in another terminal: ./debugger/observer.sh"
  fi
fi

# Tee suite terminal output so debugger can read it (Electron, Vite, npm)
npm run dev 2>&1 | tee /tmp/ai-dev-suite-electron.log
