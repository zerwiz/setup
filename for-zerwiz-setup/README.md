# Curl tools – WhyNot Productions

Workshop setup and AI dev tools. Run via `curl | bash`.

**Canonical source:** [zerwiz/setup](https://github.com/zerwiz/setup). Curl URLs point to zerwiz/setup.

This folder is synced from zerwiz/setup to WhyNotProductionsHomepage `docs/for-zerwiz-setup/` via `./scripts/sync-to-homepage.sh`. Edit files in zerwiz/setup; run the sync script to update the homepage copy.

## Tools

### Workshop Setup

Installs Node.js, Git, and the AI Dev Suite TUI (Elixir app) to `~/bin/ai-dev-suite`.

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
