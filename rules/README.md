# Tools Rules – WhyNot Productions

Rules and conventions for tools in zerwiz/setup: AI Dev Suite, RAG, and future terminal/desktop tools. This repo (setup) is the workspace; all paths are relative to the repo root.

## Contents

| Path | Purpose |
|------|---------|
| `rules.md` | Deployment scope, documentation, curl URLs, system portability, adding new tools. |
| `services/github/` | GitHub rules: branch strategy, PR workflow, changelog, commits. |
| `README.md` | This overview. |

## Quick reference

- **Deployment:** Tools live in zerwiz/setup. Push directly here.
- **Docs:** All tool docs in `doc/<name>/`. Each tool dir has a brief README pointing there.
- **Curl URLs:** All commands point to raw.githubusercontent.com/zerwiz/setup only.
- **Portability:** Install/config paths use env vars (`AI_DEV_SUITE_DIR`, `XDG_DATA_HOME`, `HOME`/`USERPROFILE`).
- **Changelog:** Update `doc/CHANGELOG.md` before commits.

## Paths in this repo

| Concern | Location |
|---------|----------|
| Cursor rules | `.cursor/rules/` (tools-core.mdc, tools.mdc) |
| GitHub rules | `rules/services/github/rules.md` |
| Tool deployment rules | `rules/rules.md` |
| Changelog | `doc/CHANGELOG.md` |

## Related

- **Code:** `ai-dev-suite/` (incl. `rag/`)
- **Docs:** `doc/`
