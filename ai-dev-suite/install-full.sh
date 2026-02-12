#!/usr/bin/env bash
# AI Dev Suite – Full install (API, Web, TUI, Electron, Debugger)
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
echo -e "${DIM}Installing API, Web UI, TUI, Electron app, and Debugger...${RESET}"
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
# Extract dir: setup-main (zerwiz/setup) or *-main (legacy)
EXTRACT_DIR="$(find . -maxdepth 1 -type d -name '*-main' | head -1)"
[[ -z "$EXTRACT_DIR" ]] && EXTRACT_DIR="setup-main"
cd "$EXTRACT_DIR"
# ai-dev-suite and debugger at root (zerwiz/setup)
AI_DEV_SUITE_DIR=""
[[ -d "ai-dev-suite" ]] && AI_DEV_SUITE_DIR="ai-dev-suite"
[[ -z "$AI_DEV_SUITE_DIR" && -d "tools/ai-dev-suite" ]] && AI_DEV_SUITE_DIR="tools/ai-dev-suite"
if [[ -z "$AI_DEV_SUITE_DIR" ]] || [[ ! -d "$AI_DEV_SUITE_DIR" ]]; then
  echo -e "${RED}Unexpected repo structure. Aborting.${RESET}"
  exit 1
fi

# Install full suite (ai-dev-suite + debugger + start scripts) to ~/.local/share/ai-dev-suite
mkdir -p "$(dirname "$INSTALL_DIR")"
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"
cp -r "$AI_DEV_SUITE_DIR" "$INSTALL_DIR/ai-dev-suite"
[[ -d "debugger" ]] && cp -r "debugger" "$INSTALL_DIR/"
for f in start-ai-dev-suite-debugger.sh start-ai-dev-suite-and-debugger.sh ensure-rag-deps.sh; do
  [[ -f "$f" ]] && cp "$f" "$INSTALL_DIR/"
done

# Suite paths (nested under ai-dev-suite)
SUITE="$INSTALL_DIR/ai-dev-suite"

echo -e "${DIM}Installing Elixir deps...${RESET}"
(cd "$SUITE/elixir_tui" && mix deps.get 2>/dev/null) || true

echo -e "${DIM}Installing Node deps (Electron app)...${RESET}"
(cd "$SUITE/electron_app" && npm install 2>/dev/null) || true

echo -e "${DIM}Installing Debugger deps...${RESET}"
[[ -d "$INSTALL_DIR/debugger/electron-app" ]] && (cd "$INSTALL_DIR/debugger/electron-app" && npm install 2>/dev/null) || true

# Create launchers
mkdir -p "$BIN_DIR"

# Write launchers with actual INSTALL_DIR (works with custom dirs, XDG, etc.)
cat > "$BIN_DIR/ai-dev-suite-api" << EOF
#!/usr/bin/env bash
cd "$SUITE/elixir_tui" && exec mix run -e "AiDevSuiteTui.API.start()"
EOF

cat > "$BIN_DIR/ai-dev-suite-web" << EOF
#!/usr/bin/env bash
cleanup() { kill \$API_PID 2>/dev/null; exit 0; }
trap cleanup SIGINT SIGTERM
cd "$SUITE/elixir_tui" && mix run -e "AiDevSuiteTui.API.start()" &
API_PID=\$!
sleep 3
cd "$SUITE/electron_app" && exec npm run dev:vite
EOF

cat > "$BIN_DIR/ai-dev-suite-tui" << EOF
#!/usr/bin/env bash
cd "$SUITE/elixir_tui" && exec ./start.sh
EOF

cat > "$BIN_DIR/ai-dev-suite-electron" << EOF
#!/usr/bin/env bash
cd "$SUITE/electron_app" && exec npm run dev
EOF

cat > "$BIN_DIR/ai-dev-suite-debugger" << EOF
#!/usr/bin/env bash
cd "$INSTALL_DIR" && exec ./start-ai-dev-suite-debugger.sh
EOF

cat > "$BIN_DIR/ai-dev-suite-and-debugger" << EOF
#!/usr/bin/env bash
cd "$INSTALL_DIR" && exec ./start-ai-dev-suite-and-debugger.sh
EOF

chmod +x "$BIN_DIR"/ai-dev-suite-*
chmod +x "$INSTALL_DIR"/*.sh 2>/dev/null || true

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
echo "  ai-dev-suite-api           – API only (http://localhost:41434)"
echo "  ai-dev-suite-web           – API + browser UI (http://localhost:5174)"
echo "  ai-dev-suite-tui           – Terminal menu"
echo "  ai-dev-suite-electron      – Desktop app"
echo "  ai-dev-suite-debugger      – Debugger UI (logs, fix suggestions)"
echo "  ai-dev-suite-and-debugger  – Suite + Debugger together"
echo ""
echo -e "${DIM}Run: ai-dev-suite-electron   (or ai-dev-suite-debugger for logs/fixes)${RESET}"
echo -e "${DIM}More: whynotproductions.netlify.app${RESET}"
echo ""
