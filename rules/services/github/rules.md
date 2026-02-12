# GitHub Rules – Tools (standalone workspace)

Branch strategy, PR workflow, and changelog for tools. **zerwiz/setup is the main repo for tools.** Do not push tools to WhyNotProductionsHomepage.

## Repositories

| Repo | Role | URL |
|------|------|-----|
| **zerwiz/setup** | **Main repo for tools** – develop here, commit, PR, changelog, curl delivery | https://github.com/zerwiz/setup |
| **WhyNotProductionsHomepage** | Homepage only (systems/frontend). **Do not push tools here.** | https://github.com/zerwiz/WhyNotProductionsHomepage |

- **Default branch:** `main` (in zerwiz/setup)
- **Tools location:** zerwiz/setup repo root (ai-dev-suite/ incl. rag/, debugger/, doc/, setup.sh, run-tui.sh, etc.)

## Branch strategy

| Branch      | Purpose |
|------------|---------|
| `main`     | Production-ready code. Protected; only updated via PR (or direct push for solo maintainer). |
| `feature/*`| New features (e.g. `feature/rag-web-search`). Branch from `main`. |
| `fix/*`    | Bug fixes (e.g. `fix/elixir-config-windows`). Branch from `main`. |
| `docs/*`   | Documentation-only changes. Branch from `main`. |

**Rule:** No direct commits to `main` for substantial changes; use a branch and open a PR. For solo work, you may push to `main` after updating the changelog.

## Pull request workflow

1. **Before opening a PR**
   - Update `doc/CHANGELOG.md` with the change.
   - Ensure tools still work (e.g. run `./run-tui.sh` or validate install script).
   - Commit with clear messages (e.g. `feat: add RAG web search`, `fix: config path on Windows`).

2. **PR contents**
   - **Title:** Short, descriptive (e.g. `feat: add Electron drive explorer`).
   - **Description:** What changed and why; link to CHANGELOG if needed.
   - **Base branch:** `main`.

3. **Merge**
   - Prefer squash merge for feature branches.
   - Delete the branch after merge.
   - **Tools live in zerwiz/setup.** Push directly to zerwiz/setup; no sync from WhyNotProductionsHomepage.

## Changelog requirement

- **File:** `doc/CHANGELOG.md` (in zerwiz/setup)
- **When:** Update before every commit that changes behavior or content (features, fixes, config that affects users).
- **Format:** Use the existing structure (date, version/section, list of changes).
- **Rule:** No merge to `main` without a corresponding CHANGELOG entry when the change is user-relevant.

## Commit message conventions

- `feat: ...` – New feature
- `fix: ...` – Bug fix
- `docs: ...` – Documentation only
- `style: ...` – Formatting, no logic change
- `chore: ...` – Build, tooling, config

Example: `feat: add RAG web research via DuckDuckGo`

## Paths (when working in zerwiz/setup repo)

| Purpose        | Path |
|----------------|------|
| Changelog      | `doc/CHANGELOG.md` |
| Credentials    | Local only, gitignored. Never commit real credentials. |

## Credentials

- GitHub credentials (token, repo URL) are stored locally only. Never commit real credentials.
