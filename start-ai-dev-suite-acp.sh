#!/usr/bin/env bash
# Start AI Dev Suite ACP adapter (stdio – for Zed/OpenCode)
# Run from repo root. Requires: npm run build in acp-adapter/

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADAPTER_DIR="${SCRIPT_DIR}/ai-dev-suite/acp-adapter"
DIST="${ADAPTER_DIR}/dist/index.js"

if [[ ! -f "$DIST" ]]; then
  echo "ACP adapter not built. Run: cd ${ADAPTER_DIR} && npm install && npm run build"
  exit 1
fi

exec node "$DIST" "$@"
