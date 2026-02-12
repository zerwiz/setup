# Zerwiz AI Dev Suite

Terminal and desktop tools for AI development resources, install commands, and Ollama chat. Styled with the WhyNot Productions look.

**Must be pushed to zerwiz/setup.** See `rules/deployment/rules.md` and `docs/for-zerwiz-setup/`.

## Purpose

- **Electron app** – Desktop GUI: Home, Chat, Drive, Memory, Tools, Settings, Server ↻, Quit. Quit button saves workspace and all chats.
- **Elixir TUI** – Interactive terminal: install tools, chat with Ollama, slash commands (`/memory`, `/remember`, `/drive`, `/research`, `/bye`)
- **Install script** – Installation commands for Zed, OpenCode, Ollama, LM Studio, OpenClaw, Workshop (aligned with TUI)
- **ACP adapter** – Connect Zed/OpenCode to the suite via Agent Client Protocol; use local AI from your editor

## Usage

**Display commands:**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash
```

**Install a tool directly:**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash -s ollama
```
Options: `zed`, `opencode`, `ollama`, `lm`, `openclaw`, `workshop` (or `1`–`6`).

## Elixir TUI (interactive)

For an interactive menu to select what to install:

**macOS/Linux:** `./elixir_tui/start.sh`  
**Windows:** `elixir_tui\start.ps1` or `elixir_tui\start.bat`

Startup scripts install Elixir if needed. See [elixir-tui.md](./elixir-tui.md).

## In zerwiz/setup

Edit `ai-dev-suite/install.sh` here. To update the homepage copy, run `./scripts/sync-to-homepage.sh`; that copies `for-zerwiz-setup/` to WhyNotProductionsHomepage.

## Zed & OpenCode (ACP)

Connect your code editor to the AI Dev Suite via the [Agent Client Protocol](https://agentclientprotocol.com). **Requires:** API at http://localhost:41434 (run Electron app or `ai-dev-suite-api` first).

**Build:** `cd ai-dev-suite/acp-adapter && npm install && npm run build`

**Zed:** Add to `~/.config/zed/settings.json`:
```json
"agent_servers": {
  "AI Dev Suite": {
    "command": "node",
    "args": ["/absolute/path/to/acp-adapter/dist/index.js"]
  }
}
```
Path: `ai-dev-suite/acp-adapter/dist/index.js` (repo) or `~/.local/share/ai-dev-suite/acp-adapter/dist/index.js` (install-full). Then: Command Palette → `agent: new thread` → "AI Dev Suite".

**OpenCode:** No published config yet for OpenCode as ACP client. See ZED_OPENCODE_ACP.md §7. Use Zed or JetBrains today.

**Script:** From repo root, `./start-ai-dev-suite-acp.sh` runs the adapter (stdio).

See [START.md](./START.md#zed--opencode-acp), [ZED_OPENCODE_ACP.md](./ZED_OPENCODE_ACP.md), [acp-adapter/README.md](../../ai-dev-suite/acp-adapter/README.md).

## Documentation

- **[START.md](./START.md)** – Quick start: API and Electron app commands
- **[FUNCTIONS.md](./FUNCTIONS.md)** – Reference for all commands, features, and module functions
- [STORAGE.md](./STORAGE.md) – Where memory, drive, and RAG data are stored
- [LLAMACPP.md](./LLAMACPP.md) – llama.cpp vs Ollama: what the suite uses and why
- [SERVER.md](./SERVER.md) – Server screen: llama.cpp start/stop and config
- [GITHUB_AGENT.md](./GITHUB_AGENT.md) – (Planned) AI reads GitHub repos for development help; investigation doc
- [ZED_OPENCODE_ACP.md](./ZED_OPENCODE_ACP.md) – Zed & OpenCode integration via Agent Client Protocol (ACP)
- [PLANNING.md](./PLANNING.md) – Roadmap and implementation status
- [UI_PLANNING.md](./UI_PLANNING.md) – Standalone desktop app (Electron + React + Elixir/Phoenix)
