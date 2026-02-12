#!/usr/bin/env bash
# AI Dev Suite – Debug observer (quick run, no install)
# Tails API + Ollama logs, health checks, test chat. Use when Suite shows "(no response)".
# Run: curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-observer.sh | bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
if [[ -n "$SCRIPT_DIR" && -f "$SCRIPT_DIR/debugger/observer.sh" ]]; then
  exec "$SCRIPT_DIR/debugger/observer.sh"
fi

RED='\033[91m'
DIM='\033[2m'
RESET='\033[0m'

echo ""
echo -e "${RED}●${RESET} AI Dev Suite – Debug Observer"
echo -e "${DIM}Downloading and running...${RESET}"
echo ""

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

curl -fsSL "https://raw.githubusercontent.com/zerwiz/setup/main/debugger/observer.sh" -o "$TMP/observer.sh"
chmod +x "$TMP/observer.sh"
exec "$TMP/observer.sh"
