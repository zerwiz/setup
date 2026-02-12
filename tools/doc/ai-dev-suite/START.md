# AI Dev Suite – Start Commands

Works on **macOS, Linux, and Windows** (with Git Bash or WSL). Install location and folder structure adapt to your system.

---

## Install (curl one-liner)

Install to `~/.local/share/ai-dev-suite` and create launchers in `~/bin`:

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install-full.sh | bash
```

**Install locations** (adapts to your system):
- Code: `~/.local/share/ai-dev-suite` (or `$XDG_DATA_HOME/ai-dev-suite` on Linux)
- Config/data: `~/.config/ai-dev-suite` (memory, drive, knowledge bases)
- Override: `AI_DEV_SUITE_DIR=/path/to/install curl ... | bash`

Then run any launcher:

| Launcher | What it does |
|----------|--------------|
| `ai-dev-suite-api` | API only → http://localhost:41434 |
| `ai-dev-suite-web` | API + browser UI → http://localhost:5174 |
| `ai-dev-suite-tui` | Terminal menu |
| `ai-dev-suite-electron` | Desktop app |

---

## Quick run (no install)

**TUI only** (downloads and runs; needs Elixir):

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-tui.sh | bash
```

---

## Scripts from repo (from `tools/`)

If you have the WhyNotProductions Homepage repo cloned:

| Script | What it does |
|--------|--------------|
| `./start-ai-dev-suite-api.sh` | API only → http://localhost:41434 |
| `./start-ai-dev-suite-web.sh` | API + Vite → http://localhost:5174 |
| `./start-ai-dev-suite-electron.sh` | Electron desktop app |
| `./start-ai-dev-suite-tui.sh` | TUI (terminal menu) |

```bash
cd ~/CodeP/WhyNotProductions\ Homepage/tools
./start-ai-dev-suite-web.sh       # browser UI
./start-ai-dev-suite-electron.sh  # desktop app (npm install first in electron_app)
```

---

## Manual (two terminals)

**Terminal 1 – API**
```bash
cd ~/CodeP/WhyNotProductions\ Homepage/tools/ai-dev-suite/elixir_tui
mix run -e "AiDevSuiteTui.API.start()"
```

**Terminal 2 – React**
```bash
cd ~/CodeP/WhyNotProductions\ Homepage/tools/ai-dev-suite/electron_app
npm run dev:vite
```

Open http://localhost:5174. API: http://localhost:41434.
