#!/usr/bin/env bash
# AI Dev Suite TUI – Run interactive installer (macOS, Linux)
# Downloads and runs the Elixir TUI. Installs Elixir if needed.
# Run: curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-tui.sh | bash

set -e

RED='\033[91m'
DIM='\033[2m'
RESET='\033[0m'

echo ""
echo -e "${RED}●${RESET} AI Dev Suite TUI – WhyNot Productions"
echo -e "${DIM}Downloading and starting...${RESET}"
echo ""

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

cd "$TMP"
curl -fsSL "https://github.com/zerwiz/setup/archive/refs/heads/main.zip" -o repo.zip
unzip -q repo.zip
cd setup-main/elixir_tui
chmod +x start.sh
exec ./start.sh
