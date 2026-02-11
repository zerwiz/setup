#!/usr/bin/env bash
# Workshop Setup – WhyNot Productions
# Installs common local development tools for workshops.
# Run: curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh | bash

set -e

RED='\033[91m'
DIM='\033[2m'
RESET='\033[0m'
[[ -t 1 ]] || RED='' DIM='' RESET=''

echo ""
echo -e "${RED}●${RESET} Workshop Setup – WhyNot Productions"
echo -e "${DIM}Installing local development tools...${RESET}"
echo ""

# Detect OS
OS="$(uname -s)"
case "$OS" in
  Darwin)  OS="macos" ;;
  Linux)   OS="linux" ;;
  MINGW*|MSYS*) OS="windows" ;;
  *)       OS="unknown" ;;
esac

echo -e "${DIM}Detected: $OS${RESET}"
echo ""

# Check/install curl (needed for other installs)
if command -v curl >/dev/null 2>&1; then
  echo -e "  curl: ${DIM}(already installed)${RESET}"
else
  echo -e "  curl: ${DIM}Installing...${RESET}"
  if [[ "$OS" == "macos" ]] && command -v brew >/dev/null 2>&1; then
    brew install curl
  elif [[ "$OS" == "linux" ]]; then
    if command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update && sudo apt-get install -y curl
    elif command -v dnf >/dev/null 2>&1; then
      sudo dnf install -y curl
    else
      echo -e "  ${RED}Install curl manually${RESET}"
    fi
  else
    echo -e "  ${RED}Install curl manually${RESET}"
  fi
fi

# Check/install Node.js
if command -v node >/dev/null 2>&1; then
  echo -e "  Node.js: $(node -v) ${DIM}(already installed)${RESET}"
else
  echo -e "  Node.js: ${DIM}Installing via system package manager...${RESET}"
  if [[ "$OS" == "macos" ]] && command -v brew >/dev/null 2>&1; then
    brew install node
  elif [[ "$OS" == "linux" ]]; then
    if command -v apt-get >/dev/null 2>&1; then
      sudo apt-get update && sudo apt-get install -y nodejs npm
    elif command -v dnf >/dev/null 2>&1; then
      sudo dnf install -y nodejs npm
    else
      echo -e "  ${RED}Install Node.js manually: https://nodejs.org${RESET}"
    fi
  else
    echo -e "  ${RED}Install Node.js: https://nodejs.org${RESET}"
  fi
fi

# Check Git
if command -v git >/dev/null 2>&1; then
  echo -e "  Git: $(git --version | cut -d' ' -f3) ${DIM}(already installed)${RESET}"
else
  echo -e "  Git: ${DIM}Installing...${RESET}"
  if [[ "$OS" == "macos" ]] && command -v brew >/dev/null 2>&1; then
    brew install git
  elif [[ "$OS" == "linux" ]]; then
    if command -v apt-get >/dev/null 2>&1; then
      sudo apt-get install -y git
    elif command -v dnf >/dev/null 2>&1; then
      sudo dnf install -y git
    else
      echo -e "  ${RED}Install Git: https://git-scm.com${RESET}"
    fi
  else
    echo -e "  ${RED}Install Git: https://git-scm.com${RESET}"
  fi
fi

echo ""
echo -e "${DIM}More: whynotproductions.netlify.app · cal.com/whynotproductions${RESET}"
echo ""
