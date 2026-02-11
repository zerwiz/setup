#!/usr/bin/env bash
# AI Dev Suite TUI – Startup script (macOS, Linux)
# Installs Elixir if needed, then runs the app.
# Run: ./start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

RED='\033[91m'
DIM='\033[2m'
RESET='\033[0m'

echo ""
echo -e "${RED}●${RESET} AI Dev Suite TUI – WhyNot Productions"
echo -e "${DIM}Checking dependencies...${RESET}"
echo ""

# Detect OS
OS="$(uname -s)"
case "$OS" in
  Darwin)  OS="macos" ;;
  Linux)   OS="linux" ;;
  *)       OS="unknown" ;;
esac

install_elixir() {
  if [[ "$OS" == "macos" ]]; then
    if command -v brew >/dev/null 2>&1; then
      echo -e "${DIM}Installing Elixir via Homebrew...${RESET}"
      brew install elixir
    else
      echo -e "${RED}Homebrew required. Install: https://brew.sh${RESET}"
      exit 1
    fi
  elif [[ "$OS" == "linux" ]]; then
    if command -v apt-get >/dev/null 2>&1; then
      echo -e "${DIM}Installing Elixir via apt...${RESET}"
      sudo apt-get update
      sudo apt-get install -y elixir erlang
    elif command -v dnf >/dev/null 2>&1; then
      echo -e "${DIM}Installing Elixir via dnf...${RESET}"
      sudo dnf install -y elixir erlang
    elif command -v pacman >/dev/null 2>&1; then
      echo -e "${DIM}Installing Elixir via pacman...${RESET}"
      sudo pacman -S --noconfirm elixir erlang
    else
      echo -e "${RED}Install Elixir manually: https://elixir-lang.org/install.html${RESET}"
      exit 1
    fi
  else
    echo -e "${RED}Unsupported OS. Install Elixir: https://elixir-lang.org/install.html${RESET}"
    exit 1
  fi
}

# Check Elixir
if ! command -v mix >/dev/null 2>&1; then
  install_elixir
fi

# Fetch deps and run
echo -e "${DIM}Starting AI Dev Suite TUI...${RESET}"
echo ""
mix deps.get 2>/dev/null || true
mix run
