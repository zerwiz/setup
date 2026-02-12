#!/usr/bin/env bash
# AI Dev Suite – API only. http://localhost:41434

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/ai-dev-suite/elixir_tui"
mix run -e "AiDevSuiteTui.API.start()"
