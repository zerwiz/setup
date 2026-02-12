#!/usr/bin/env bash
# Sync setup files to WhyNotProductionsHomepage docs/for-zerwiz-setup
# Run from setup root: ./scripts/sync-to-homepage.sh
# Requires: HOMEPAGE_REPO path (default: ../WhyNotProductionsHomepage)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SETUP_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOMEPAGE_REPO="${HOMEPAGE_REPO:-$SETUP_ROOT/../WhyNotProductionsHomepage}"
DEST="$HOMEPAGE_REPO/docs/for-zerwiz-setup"

if [[ ! -d "$HOMEPAGE_REPO" ]]; then
  echo "Error: Homepage repo not found at $HOMEPAGE_REPO"
  echo "Set HOMEPAGE_REPO or clone WhyNotProductionsHomepage alongside setup."
  exit 1
fi

echo "Syncing from $SETUP_ROOT/for-zerwiz-setup to $DEST"
SRC="$SETUP_ROOT/for-zerwiz-setup"
mkdir -p "$DEST/ai-dev-suite"

cp "$SRC/setup.sh" "$DEST/"
cp "$SRC/run-tui.sh" "$DEST/"
cp "$SRC/ai-dev-suite/install.sh" "$DEST/ai-dev-suite/"
cp "$SRC/ai-dev-suite/install-full.sh" "$DEST/ai-dev-suite/"
cp "$SRC/ai-dev-suite/README.md" "$DEST/ai-dev-suite/"
cp "$SRC/README.md" "$DEST/" 2>/dev/null || true
cp "$SRC/PUSH_TO_SETUP.md" "$DEST/" 2>/dev/null || true

echo "Done. Commit and push in $HOMEPAGE_REPO to update curl URLs."
