#!/usr/bin/env bash
# AI Dev Suite – Electron desktop app

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/ai-dev-suite/electron_app"
npm run dev
