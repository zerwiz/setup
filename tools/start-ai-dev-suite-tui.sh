#!/usr/bin/env bash
# AI Dev Suite – TUI (terminal menu)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/ai-dev-suite/elixir_tui"
exec ./start.sh
