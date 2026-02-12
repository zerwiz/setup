# AI Dev Suite TUI

Interactive Elixir app. Run `./start.sh` (Mac/Linux) or `.\start.ps1` (Windows).

**HTTP API (for Electron app):**
```bash
mix run -e "AiDevSuiteTui.API.start()"
```
Runs the API at http://localhost:41434. Configure port in `config/config.exs` (`:api_port`).

**Full documentation:** [doc/ai-dev-suite/](../../doc/ai-dev-suite/)
