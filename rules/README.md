# Tools Rules – WhyNot Productions

Rules and conventions for tools in `tools/`: AI Dev Suite, RAG, and future terminal/desktop tools.  
**Standalone workspace:** When `tools/` is opened as the workspace root, all paths below are relative to `tools/`.

## Contents

| Path | Purpose |
|------|---------|
| `rules.md` | Deployment scope, documentation, push workflow, curl URLs, system portability, adding new tools. |
| `services/github/` | GitHub rules: branch strategy, PR workflow, changelog, commits (adapted for tools workspace). |
| `README.md` | This overview. |

## Quick reference

- **Deployment:** Tools are **never** deployed to Netlify. They live in zerwiz/setup and are curl-able.
- **Docs:** All tool docs in `doc/<name>/`. Each tool dir has a brief README pointing there.
- **Push:** Run `bash ../scripts/push-to-setup.sh` from tools root (or `./scripts/push-to-setup.sh` from repo root).
- **Curl URLs:** All commands point to raw.githubusercontent.com/zerwiz/setup only.
- **Portability:** Install/config paths use env vars (`AI_DEV_SUITE_DIR`, `XDG_DATA_HOME`, `HOME`/`USERPROFILE`).
- **Changelog:** Update `../docs/Project Management/CHANGELOG.md` before commits.

## When tools is workspace root

| Concern | Location |
|---------|----------|
| Cursor rules | `.cursor/rules/` (tools-core.mdc, tools.mdc) |
| GitHub rules | `rules/services/github/rules.md` |
| Tool deployment rules | `rules/rules.md` |
| Changelog | `../docs/Project Management/CHANGELOG.md` |
| Push script | `../scripts/push-to-setup.sh` |

## Related

- **Code:** `ai-dev-suite/`, `rag/`
- **Docs:** `doc/`, `../docs/for-zerwiz-setup/`
- **Project root:** `../` (parent of tools)
