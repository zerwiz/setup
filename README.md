# setup

Workshop setup and AI dev tools for WhyNot Productions. Run via `curl | bash`.

## Tools

### Workshop Setup

Installs Node.js, Git, and the AI Dev Suite TUI (Elixir app) to `~/bin/ai-dev-suite`. Same functionality as the TUI: install tools, start Ollama, chat with models.

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh | bash
```

### AI Dev Suite TUI

Interactive menu to select and install AI tools. Installs Elixir if needed. Mac/Linux.

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-tui.sh | bash
```

### AI Dev Suite – Full install (API, Web, TUI, Electron)

Installs to `~/.local/share/ai-dev-suite` and creates launchers in `~/bin`.

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install-full.sh | bash
```

Launchers: `ai-dev-suite-api`, `ai-dev-suite-web`, `ai-dev-suite-tui`, `ai-dev-suite-electron`.

### AI Dev Suite (display / one-liner install)

Displays or installs AI dev tools (Zed, LM Studio, Ollama, Pinokio, ClawCode).

**Display only:**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash
```

**Install a tool directly:**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash -s ollama
```
Options: `ollama`, `zed`, `lm`, `pinokio`, `claw` (or `1`–`5`).

## Structure

```
setup/
├── README.md            # This file
├── setup.sh             # Workshop Setup
├── run-tui.sh           # AI Dev Suite TUI (quick run)
└── ai-dev-suite/
    ├── README.md
    ├── install.sh       # Display / install AI dev tools
    └── install-full.sh  # Full install (API, Web, TUI, Electron)
```

## Source

These files are maintained in [WhyNotProductionsHomepage](https://github.com/zerwiz/WhyNotProductionsHomepage) under `tools/` and `docs/for-zerwiz-setup/`. Push updates from there to this repo.
