#!/usr/bin/env bash
# AI Dev Suite – Debug A2A agent
# Exposes the debug observer via Google's Agent2Agent (A2A) protocol.
# Other A2A agents can query it for status and analysis.
# Usage: ./debugger/start-a2a.sh
# Agent card: http://localhost:41435/.well-known/agent-card.json

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADAPTER_DIR="$SCRIPT_DIR/a2a-adapter"

if [ ! -f "$ADAPTER_DIR/package.json" ]; then
  echo "Error: a2a-adapter not found at $ADAPTER_DIR"
  exit 1
fi

cd "$ADAPTER_DIR"
if [ ! -d "node_modules" ]; then
  echo "Installing A2A adapter dependencies..."
  npm install
fi
if [ ! -f "dist/index.js" ]; then
  npm run build
fi
node dist/index.js
