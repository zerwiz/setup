#!/usr/bin/env bash
# AI Dev Suite – Debugger UI (Electron app)
# Usage: ./start-ai-dev-suite-debugger-ui.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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
