# AI Dev Suite TUI

Interactive Elixir app for installing AI dev tools. Run from the terminal and select what to install.

## Quick start (installs dependencies automatically)

**macOS / Linux:**
```bash
cd tools/ai-dev-suite/elixir_tui
./start.sh
```

**Windows (PowerShell):**
```powershell
cd tools\ai-dev-suite\elixir_tui
.\start.ps1
```

**Windows (CMD):**
```cmd
cd tools\ai-dev-suite\elixir_tui
start.bat
```

The startup scripts install Elixir (via Homebrew/apt/dnf/pacman on Mac/Linux; winget/Chocolatey on Windows) if needed, then run the app.

## Manual run (if Elixir already installed)

```bash
mix run
```

**Build standalone escript:**
```bash
mix escript.build
./ai_dev_suite_tui
```

## Usage

- `[1]` Ollama
- `[2]` Zed  
- `[3]` LM Studio
- `[4]` Pinokio
- `[5]` ClawCode
- `[a]` Install all
- `[q]` Quit
