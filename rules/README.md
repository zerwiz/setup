# Tools Rules – WhyNot Productions

Rules and conventions for tools in zerwiz/setup: AI Dev Suite, RAG, and future terminal/desktop tools. This repo (setup) is the workspace; all paths are relative to the repo root.

## Contents

| Path | Purpose |
|------|---------|
| `rules.md` | Deployment scope, documentation, curl URLs, system portability, adding new tools. |
| `services/github/` | GitHub rules: branch strategy, PR workflow, changelog, commits. |
| `README.md` | This overview. |

## Quick reference

- **Deployment:** Tools live in zerwiz/setup. Push directly here. Never push tools to WhyNotProductionsHomepage.
- **Docs:** All tool docs in `doc/<name>/`. Each tool dir has a brief README pointing there.
- **Sync to homepage:** Run `./scripts/sync-to-homepage.sh` to copy for-zerwiz-setup/ to the homepage repo.
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
| Sync script | `scripts/sync-to-homepage.sh` |

## Related

- **Code:** `ai-dev-suite/`, `rag/`
- **Docs:** `doc/`, `for-zerwiz-setup/`
- **Homepage:** WhyNotProductionsHomepage (separate repo; we sync for-zerwiz-setup/ there)
