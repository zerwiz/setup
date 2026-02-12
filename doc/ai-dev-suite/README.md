# AI Dev Suite

Terminal tool that displays AI development resources and install commands. Styled with the WhyNot Productions look.

**Must be pushed to zerwiz/setup.** See `rules/deployment/rules.md` and `docs/for-zerwiz-setup/`.

## Purpose

- Show installation commands for Zed, LM Studio, Ollama, Pinokio, ClawCode
- Link to model libraries (Hugging Face, Civitai) and frameworks (Agent OS, BMAD)
- Zero installation: script echoes formatted content only; user copies commands

## Usage

**Display commands:**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash
```

**Install a tool directly:**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash -s ollama
```
Options: `ollama`, `zed`, `lm`, `pinokio`, `claw` (or `1`–`5`).

## Elixir TUI (interactive)

For an interactive menu to select what to install:

**macOS/Linux:** `./elixir_tui/start.sh`  
**Windows:** `elixir_tui\start.ps1` or `elixir_tui\start.bat`

Startup scripts install Elixir if needed. See [elixir-tui.md](./elixir-tui.md).

## Push to zerwiz/setup

1. Edit `install.sh` here
2. Sync to `docs/for-zerwiz-setup/ai-dev-suite/`
3. Follow `docs/for-zerwiz-setup/PUSH_TO_SETUP.md`

## Documentation

- **[START.md](./START.md)** – Quick start: API and Electron app commands
- **[FUNCTIONS.md](./FUNCTIONS.md)** – Reference for all commands, features, and module functions
- [STORAGE.md](./STORAGE.md) – Where memory, drive, and RAG data are stored
- [PLANNING.md](./PLANNING.md) – Roadmap and implementation status
- [UI_PLANNING.md](./UI_PLANNING.md) – Standalone desktop app (Electron + React + Elixir/Phoenix)
