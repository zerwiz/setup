#!/usr/bin/env bash
# Ensure RAG/web research dependencies are installed. Silent, non-fatal.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REQ="$SCRIPT_DIR/rag/requirements.txt"
if [ -f "$REQ" ]; then
  pip install -q -r "$REQ" 2>/dev/null || pip3 install -q -r "$REQ" 2>/dev/null || true
fi
