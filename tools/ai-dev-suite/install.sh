#!/usr/bin/env bash
# Zerwiz AI Dev Suite – WhyNot Productions
# Installs AI dev tools or displays install commands.
# Run: curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash

set -e

# ANSI codes (WhyNot Productions palette)
if [[ -t 1 ]]; then
  RED='\033[91m'
  CYAN='\033[96m'
  WHITE='\033[1;37m'
  DIM='\033[2m'
  RESET='\033[0m'
  BAR="${RED}▌${RESET}"
  TTY=1
else
  RED='' CYAN='' WHITE='' DIM='' RESET='' BAR='|'
  TTY=0
fi

# Install commands for each tool
INSTALL_ZED='curl -fsSL https://zed.dev/install.sh | sh'
INSTALL_LM='curl -fsSL -L https://lmstudio.ai/install.sh | sh'
INSTALL_OLLAMA='curl -fsSL https://ollama.com/install.sh | sh'
INSTALL_PINOKIO='curl -fsSL https://pinokio.computer/install.sh | sh'
INSTALL_CLAW='curl -fsSL https://clawcode.ai/install.sh | sh'

section() {
  printf "\n${BAR} ${WHITE}%s${RESET}\n" "$1"
  printf "${DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
}

tool() {
  printf "\n${WHITE}%s${RESET}\n" "$1"
  printf "${DIM}%s${RESET}\n" "$2"
  printf "  ${RED}▸${RESET} ${CYAN}%s${RESET}\n" "$3"
  printf "  ${DIM}%s${RESET}\n" "$4"
}

card() {
  printf "\n${WHITE}%s${RESET}\n" "$1"
  printf "${DIM}%s${RESET}\n" "$2"
  printf "  ${DIM}%s${RESET}\n" "$3"
}

# Header
printf "\n"
printf "  ${RED}●${RESET} ${RED}Zerwiz AI${RESET} ${WHITE}Dev Suite${RESET}\n"
printf "  ${DIM}Installation commands and resource links for AI development.${RESET}\n"
printf "  ${DIM}WhyNot Productions · whynotproductions.netlify.app${RESET}\n"

# Core Tools
section "Core Tools"

tool "1. Zed" \
  "High performance code editor. Built for collaboration." \
  "$INSTALL_ZED" \
  "https://zed.dev"

tool "2. LM Studio" \
  "Local LLM runner. Discover and download models." \
  "$INSTALL_LM" \
  "https://lmstudio.ai"

tool "3. Ollama" \
  "Run large language models locally. Simple setup." \
  "$INSTALL_OLLAMA" \
  "https://ollama.com"

tool "4. Pinokio" \
  "Browser for AI applications. Automated installation for local models." \
  "$INSTALL_PINOKIO" \
  "https://pinokio.computer"

tool "5. ClawCode" \
  "Terminal based code editor. Optimized for AI workflows." \
  "$INSTALL_CLAW" \
  "https://clawcode.ai"

# Model Libraries
section "Model Libraries"

card "Hugging Face" \
  "Open source model hub. Large scale dataset storage." \
  "https://huggingface.co"

card "Civitai" \
  "Platform for stable diffusion models. Community driven sharing." \
  "https://civitai.com"

# Frameworks and Projects
section "Frameworks and Projects"

card "Agent OS" \
  "Operating system for AI agents." \
  "https://agent-os.ai  |  https://github.com/OpenBMB/AgentOS"

card "BMAD" \
  "Model development and management tools." \
  "https://bmad.ai  |  https://github.com/bmad-git/bmad"

# Install if argument passed: curl ... | bash -s ollama
do_install() {
  case "$1" in
    zed|1)     echo ""; echo "Installing Zed...";      eval "$INSTALL_ZED" ;;
    lm|2)      echo ""; echo "Installing LM Studio..."; eval "$INSTALL_LM" ;;
    ollama|3)  echo ""; echo "Installing Ollama...";   eval "$INSTALL_OLLAMA" ;;
    pinokio|4) echo ""; echo "Installing Pinokio...";  eval "$INSTALL_PINOKIO" ;;
    claw|5)    echo ""; echo "Installing ClawCode..."; eval "$INSTALL_CLAW" ;;
    *)         echo ""; echo "Unknown: $1. Use: ollama, zed, lm, pinokio, claw" ;;
  esac
}
if [[ -n "${1:-}" ]]; then
  do_install "$1"
fi

# Footer
printf "\n"
printf "${DIM}Copy a command above and run it in your terminal to install.${RESET}\n"
printf "${DIM}More: whynotproductions.netlify.app · cal.com/whynotproductions${RESET}\n"
printf "\n"
