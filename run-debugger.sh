#!/usr/bin/env bash
# AI Dev Suite – Debugger (quick run, no install)
# Downloads repo, starts API + Ollama + Debugger UI. Diagnose "(no response)", view logs, get fix suggestions.
# Run: curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-debugger.sh | bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
if [[ -n "$SCRIPT_DIR" && -f "$SCRIPT_DIR/start-ai-dev-suite-debugger.sh" ]]; then
  exec "$SCRIPT_DIR/start-ai-dev-suite-debugger.sh"
fi

RED='\033[91m'
DIM='\033[2m'
RESET='\033[0m'

echo ""
echo -e "${RED}●${RESET} AI Dev Suite – Debugger"
echo -e "${DIM}Downloading and starting...${RESET}"
echo ""

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

cd "$TMP"
curl -fsSL "https://github.com/zerwiz/setup/archive/refs/heads/main.tar.gz" | tar xz
EXTRACT_DIR="$(find . -maxdepth 1 -type d -name '*-main' | head -1)"
[[ -z "$EXTRACT_DIR" ]] && EXTRACT_DIR="setup-main"
cd "$EXTRACT_DIR"

if [[ ! -f "start-ai-dev-suite-debugger.sh" ]]; then
  echo "Error: start-ai-dev-suite-debugger.sh not found in zerwiz/setup."
  exit 1
fi

chmod +x start-ai-dev-suite-debugger.sh
exec ./start-ai-dev-suite-debugger.sh
