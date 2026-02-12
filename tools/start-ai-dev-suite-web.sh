#!/usr/bin/env bash
# AI Dev Suite – API + Vite for browser. Open http://localhost:5174

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/ai-dev-suite"

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
npm run dev:vite
