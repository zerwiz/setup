#!/usr/bin/env bash
# AI Dev Suite – Full install (API, Web, TUI, Electron)
# Installs to ~/.local/share/ai-dev-suite (or AI_DEV_SUITE_DIR) and creates launchers in ~/bin or ~/.local/bin
# Run: curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install-full.sh | bash
#
# Overrides: AI_DEV_SUITE_DIR, AI_DEV_SUITE_BIN_DIR, AI_DEV_SUITE_REPO, AI_DEV_SUITE_BRANCH

set -e

# Resolve HOME (Windows Git Bash / WSL: use USERPROFILE if HOME unset)
[[ -z "$HOME" && -n "$USERPROFILE" ]] && export HOME="$USERPROFILE"

REPO="${AI_DEV_SUITE_REPO:-https://github.com/zerwiz/setup}"
BRANCH="${AI_DEV_SUITE_BRANCH:-main}"

# Install location: XDG_DATA_HOME on Linux, or override
if [[ -n "$AI_DEV_SUITE_DIR" ]]; then
  INSTALL_DIR="$AI_DEV_SUITE_DIR"
elif [[ -n "$XDG_DATA_HOME" ]]; then
  INSTALL_DIR="${XDG_DATA_HOME}/ai-dev-suite"
else
  INSTALL_DIR="${HOME}/.local/share/ai-dev-suite"
fi

# Launcher dir: prefer ~/.local/bin (XDG), then override, then ~/bin
if [[ -n "$AI_DEV_SUITE_BIN_DIR" ]]; then
  BIN_DIR="$AI_DEV_SUITE_BIN_DIR"
elif [[ -n "$XDG_DATA_HOME" ]]; then
  BIN_DIR="${HOME}/.local/bin"
else
  BIN_DIR="${HOME}/bin"
fi

RED='\033[91m'
WHITE='\033[1;37m'
DIM='\033[2m'
RESET='\033[0m'
[[ -t 1 ]] || RED='' WHITE='' DIM='' RESET=''

echo ""
echo -e "${RED}●${RESET} ${RED}Zerwiz AI${RESET} ${WHITE}Dev Suite${RESET} – WhyNot Productions"
echo -e "${DIM}Installing API, Web UI, TUI, and Electron app...${RESET}"
echo ""

# Check basic deps
for cmd in curl tar; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo -e "${RED}Missing: $cmd. Please install it first.${RESET}"
    exit 1
  fi
done

# Optional but recommended: Elixir + Node (warn if missing)
NEED_DEPS=0
command -v mix >/dev/null 2>&1 || { NEED_DEPS=1; echo -e "${DIM}Note: Elixir not found. Install: https://elixir-lang.org/install.html (or ai-dev-suite-tui will try to install)${RESET}"; }
command -v node >/dev/null 2>&1 || { NEED_DEPS=1; echo -e "${DIM}Note: Node.js not found. Install: https://nodejs.org (needed for Web/Electron)${RESET}"; }
[[ $NEED_DEPS -eq 1 ]] && echo ""

echo -e "${DIM}Fetching from $REPO (branch: $BRANCH)...${RESET}"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

cd "$TMP"
curl -fsSL "${REPO}/archive/refs/heads/${BRANCH}.tar.gz" | tar xz
EXTRACT_DIR="$(find . -maxdepth 1 -type d -name '*-main' | head -1)"
[[ -z "$EXTRACT_DIR" ]] && EXTRACT_DIR="setup-main"
cd "$EXTRACT_DIR"

# ai-dev-suite at root (setup) or in tools/ (legacy)
AI_DEV_SUITE_SRC=""
[[ -d "ai-dev-suite" ]] && AI_DEV_SUITE_SRC="ai-dev-suite"
[[ -z "$AI_DEV_SUITE_SRC" && -d "tools/ai-dev-suite" ]] && AI_DEV_SUITE_SRC="tools/ai-dev-suite"
if [[ -z "$AI_DEV_SUITE_SRC" ]] || [[ ! -d "$AI_DEV_SUITE_SRC" ]]; then
  echo -e "${RED}Unexpected repo structure. Aborting.${RESET}"
  exit 1
fi

# Install to ~/.local/share/ai-dev-suite
mkdir -p "$(dirname "$INSTALL_DIR")"
rm -rf "$INSTALL_DIR"
cp -r "$AI_DEV_SUITE_SRC" "$INSTALL_DIR"

echo -e "${DIM}Installing Elixir deps...${RESET}"
(cd "$INSTALL_DIR/elixir_tui" && mix deps.get 2>/dev/null) || true

echo -e "${DIM}Installing Node deps (Electron app)...${RESET}"
(cd "$INSTALL_DIR/electron_app" && npm install 2>/dev/null) || true

# Create launchers
mkdir -p "$BIN_DIR"

# Write launchers with actual INSTALL_DIR (works with custom dirs, XDG, etc.)
cat > "$BIN_DIR/ai-dev-suite-api" << EOF
#!/usr/bin/env bash
cd "$INSTALL_DIR/elixir_tui" && exec mix run -e "AiDevSuiteTui.API.start()"
EOF

cat > "$BIN_DIR/ai-dev-suite-web" << EOF
#!/usr/bin/env bash
cleanup() { kill \$API_PID 2>/dev/null; exit 0; }
trap cleanup SIGINT SIGTERM
cd "$INSTALL_DIR/elixir_tui" && mix run -e "AiDevSuiteTui.API.start()" &
API_PID=\$!
sleep 3
cd "$INSTALL_DIR/electron_app" && exec npm run dev:vite
EOF

cat > "$BIN_DIR/ai-dev-suite-tui" << EOF
#!/usr/bin/env bash
cd "$INSTALL_DIR/elixir_tui" && exec ./start.sh
EOF

cat > "$BIN_DIR/ai-dev-suite-electron" << EOF
#!/usr/bin/env bash
cd "$INSTALL_DIR/electron_app" && exec npm run dev
EOF

chmod +x "$BIN_DIR"/ai-dev-suite-*

# Add ~/bin to PATH if needed
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
  for f in "$HOME/.bashrc" "$HOME/.profile" "$HOME/.bash_profile" "$HOME/.zshrc"; do
    if [[ -f "$f" ]] && ! grep -qF "$BIN_DIR" "$f" 2>/dev/null; then
      echo '' >> "$f"
      echo '# AI Dev Suite (WhyNot Productions)' >> "$f"
      echo "export PATH=\"$BIN_DIR:\$PATH\"" >> "$f"
      echo -e "  ${DIM}Added $BIN_DIR to PATH in $f${RESET}"
      break
    fi
  done
fi

echo ""
echo -e "${DIM}Installed to $INSTALL_DIR${RESET}"
echo -e "${DIM}Launchers in $BIN_DIR:${RESET}"
echo "  ai-dev-suite-api      – API only (http://localhost:41434)"
echo "  ai-dev-suite-web      – API + browser UI (http://localhost:5174)"
echo "  ai-dev-suite-tui      – Terminal menu"
echo "  ai-dev-suite-electron – Desktop app"
echo ""
echo -e "${DIM}Run: ai-dev-suite-web   (or ai-dev-suite-tui, ai-dev-suite-electron)${RESET}"
echo -e "${DIM}More: whynotproductions.netlify.app${RESET}"
echo ""
