#!/usr/bin/env bash
# AI Dev Suite – Debug observer
# Watches API log, Ollama log, and reports health. Run alongside the app.
# Uses qwen2.5-coder:3b to analyze output and suggest fixes (override: DEBUG_MODEL=qwen2.5-coder:7b)
# Usage: ./debugger/observer.sh
# Or: DEBUG=1 ./start-ai-dev-suite-electron.sh (spawns this automatically)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEBUG_MODEL="${DEBUG_MODEL:-qwen2.5-coder:3b}"

echo "=============================================="
echo "  AI Dev Suite – Debug Observer"
echo "=============================================="
echo ""
echo "Watching: /tmp/ai-dev-suite-api.log, /tmp/ollama.log"
echo "Health: API :41434, Ollama :11434, Vite :5174 (every 10s)"
echo "Debug assistant: $DEBUG_MODEL (override with DEBUG_MODEL)"
echo "A2A agent: run ./debugger/start-a2a.sh for Google Agent2Agent protocol"
echo "Press Ctrl+C to stop."
echo ""

# Ensure log files exist (tail -f needs them)
touch /tmp/ai-dev-suite-api.log /tmp/ollama.log 2>/dev/null || true

# Ask debug model to analyze context (Ollama direct, so it works even if API is broken)
ask_debug_model() {
  local context="$1"
  local tmp
  tmp=$(mktemp)
  local prompt="You are a debugging assistant for an AI chat app (Ollama + Elixir API + Electron). Analyze this debug output and suggest what might be wrong and how to fix it. Be concise (2-4 short bullets)."
  if command -v jq >/dev/null 2>&1; then
    local ctx_escaped
    ctx_escaped=$(echo "$context" | head -c 6000 | jq -Rs .)
    jq -n --arg model "$DEBUG_MODEL" --arg prompt "$prompt" --argjson ctx "$ctx_escaped" \
      '{model: $model, messages: [{role: "user", content: ($prompt + "\n\n---\n\n" + $ctx)}]}' > "$tmp" 2>/dev/null
  else
    # Fallback: truncate, sanitize for JSON (no newlines in string, no quotes)
    local safe
    safe=$(echo "$context" | head -c 4000 | tr '\n' ' ' | tr -d '\000-\037"' | head -c 3000)
    printf '{"model":"%s","messages":[{"role":"user","content":"%s --- Debug output: %s"}]}' \
      "$DEBUG_MODEL" "$prompt" "$safe" > "$tmp" 2>/dev/null
  fi
  local reply
  reply=$(curl -s --max-time 120 -X POST http://localhost:11434/api/chat \
    -H "Content-Type: application/json" -d @"$tmp" 2>/dev/null)
  rm -f "$tmp"
  if command -v jq >/dev/null 2>&1; then
    echo "$reply" | jq -r '.message.content // empty'
  else
    echo "$reply" | grep -o '"content":"[^"]*"' | head -1 | sed 's/"content":"//;s/"$//' | sed 's/\\n/\n/g'
  fi
}

# One-shot test chat + debug model analysis on startup
(
  sleep 8
  echo ""
  echo "[TEST $(date +%H:%M:%S)] Running test chat (curl to /api/chat/stream)..."
  # Use first available model, fallback to llama3.1:latest
  MODEL="llama3.1:latest"
  if command -v curl >/dev/null 2>&1; then
    MODELS=$(curl -s --max-time 2 http://localhost:41434/api/ollama/models 2>/dev/null)
    if echo "$MODELS" | grep -q '"models"'; then
      FIRST=$(echo "$MODELS" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
      [ -n "$FIRST" ] && MODEL="$FIRST"
    fi
  fi
  BODY="{\"model\":\"$MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}],\"knowledge_base\":\"default\"}"
  OUT=$(curl -s -N --max-time 30 -X POST http://localhost:41434/api/chat/stream \
    -H "Content-Type: application/json" -d "$BODY" 2>&1 | head -20)
  if [ -n "$OUT" ]; then
    echo "[TEST] Model: $MODEL | First 20 lines:"
    echo "$OUT" | sed 's/^/  /'
    if echo "$OUT" | grep -q '"delta"'; then
      echo "[TEST] OK: Got delta chunks"
    elif echo "$OUT" | grep -q '"done"'; then
      echo "[TEST] OK: Got done (possibly empty)"
    elif echo "$OUT" | grep -q '"error"'; then
      echo "[TEST] ERROR in stream"
    else
      echo "[TEST] No delta/done/error – possible empty stream or (no response)"
    fi
  else
    echo "[TEST] No output – API down or timeout?"
  fi
  echo ""

  # Build context for debug model: test output + last log lines + status
  API_LAST=$(tail -15 /tmp/ai-dev-suite-api.log 2>/dev/null || echo "(no API log)")
  OLLA_LAST=$(tail -15 /tmp/ollama.log 2>/dev/null || echo "(no Ollama log)")
  API_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://localhost:41434/api/ollama/models 2>/dev/null)
  OLLA_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://localhost:11434/api/tags 2>/dev/null)
  [ "$API_STATUS" = "000" ] || [ -z "$API_STATUS" ] && API_STATUS="down"
  [ "$OLLA_STATUS" = "000" ] || [ -z "$OLLA_STATUS" ] && OLLA_STATUS="down"
  CONTEXT="Test chat output:\n$OUT\n\nAPI status: $API_STATUS | Ollama status: $OLLA_STATUS\n\nAPI log (last 15 lines):\n$API_LAST\n\nOllama log (last 15 lines):\n$OLLA_LAST"

  echo "[DEBUG $(date +%H:%M:%S)] Asking $DEBUG_MODEL for analysis..."
  if ollama list 2>/dev/null | grep -q "qwen2.5-coder"; then
    REPLY=$(ask_debug_model "$(echo -e "$CONTEXT")")
    if [ -n "$REPLY" ]; then
      echo ""
      echo "--- Debug assistant ($DEBUG_MODEL) ---"
      echo "$REPLY"
      echo "--------------------------------------"
    else
      echo "[DEBUG] No response from model (may be loading). Try: ollama run $DEBUG_MODEL"
    fi
  else
    echo "[DEBUG] $DEBUG_MODEL not found. Run: ollama pull $DEBUG_MODEL"
  fi
  echo ""
) &

# Tail both logs with labels
tail -f /tmp/ai-dev-suite-api.log 2>/dev/null | sed 's/^/[API]    /' &
TAIL_API=$!
tail -f /tmp/ollama.log 2>/dev/null | sed 's/^/[OLLAMA] /' &
TAIL_OLLA=$!

# Status loop
(
  while true; do
    sleep 10
    API=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://localhost:41434/api/ollama/models 2>/dev/null)
    OLLA=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://localhost:11434/api/tags 2>/dev/null)
    VITE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 http://localhost:5174/ 2>/dev/null)
    [ "$API" = "000" ] || [ -z "$API" ] && API="down"
    [ "$OLLA" = "000" ] || [ -z "$OLLA" ] && OLLA="down"
    [ "$VITE" = "000" ] || [ -z "$VITE" ] && VITE="down"
    echo ""
    echo "[STATUS $(date +%H:%M:%S)] API:41434=$API | Ollama:11434=$OLLA | Vite:5174=$VITE"
    echo ""
  done
) &
STATUS_PID=$!

cleanup() {
  kill $TAIL_API $TAIL_OLLA $STATUS_PID 2>/dev/null
  exit 0
}
trap cleanup INT TERM

wait $TAIL_API $TAIL_OLLA 2>/dev/null
cleanup
