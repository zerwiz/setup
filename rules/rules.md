# Tools Rules – WhyNot Productions

**zerwiz/setup is the main repo for tools.** Develop there. Commit there. Push there. Do not push tools to WhyNotProductionsHomepage.

---

## 1. Deployment scope

| Destination | Contents |
|-------------|----------|
| **Netlify** | Only `systems/frontend/` in WhyNotProductionsHomepage → `dist/` |
| **zerwiz/setup** | All tools content: ai-dev-suite/, rag/, doc/, start scripts, install scripts – **develop here** |

- Tools are delivered via `curl | bash` from raw.githubusercontent.com/zerwiz/setup.
- Push directly to zerwiz/setup. No sync from WhyNotProductionsHomepage.

---

## 2. Documentation

- **Location:** All tool docs live in **`doc/`** (in zerwiz/setup).
- **Structure:** `doc/ai-dev-suite/`, `doc/rag/`, `doc/<new-tool>/`.
- **Per-tool README:** Each `<name>/` dir keeps a brief README pointing to `doc/<name>/`.
- **When changing a tool:** Update the relevant doc. Add docs (e.g. STORAGE.md, FUNCTIONS.md) when adding features.

### AI Dev Suite docs (tools/doc/ai-dev-suite/)

| Doc | Purpose |
|-----|---------|
| README.md | Overview, purpose, usage |
| START.md | Quick start: API, Electron, TUI commands |
| FUNCTIONS.md | Reference for commands, features, module functions |
| STORAGE.md | Where memory, drive, RAG data are stored |
| SERVER.md | Server screen, llama.cpp integration |
| LLAMACPP.md | llama.cpp vs Ollama usage |
| PLANNING.md | Roadmap, implementation status |
| UI_PLANNING.md | Electron app planning |

---

## 3. Work in zerwiz/setup

- **Main repo:** https://github.com/zerwiz/setup — clone, develop, commit, push here.
- **Do not** push tools to WhyNotProductionsHomepage.

---

## 4. Curl commands (authoritative URLs)

All curl commands must point to **zerwiz/setup only** (never to Netlify or raw content from this repo):

- **AI Dev Suite – full install:**
  ```
  curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install-full.sh | bash
  ```
- **AI Dev Suite – display install commands:**
  ```
  curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash
  ```
- **AI Dev Suite TUI:**
  ```
  curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-tui.sh | bash
  ```
- **Workshop Setup:**
  ```
  curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh | bash
  ```

---

## 5. AI Dev Suite – system portability

The install must work on **any user machine** (macOS, Linux, Windows with Git Bash/WSL):

- **Install dir:** `~/.local/share/ai-dev-suite` or `$XDG_DATA_HOME/ai-dev-suite`; override with `AI_DEV_SUITE_DIR`, `AI_DEV_SUITE_BIN_DIR`.
- **Config dir:** `~/.config/ai-dev-suite` (memory, drive, knowledge bases). Elixir uses `HOME` or `USERPROFILE`.
- **Paths:** Install dir (code) ≠ config dir (user data). Never hardcode paths; use env vars.
- **Launchers:** Must embed the actual install path so custom dirs work.

---

## 6. Adding a new tool

1. In zerwiz/setup, create `<name>/` with `install.sh` (if applicable) and a README.
2. Add docs in `doc/<name>/`.
3. Update CHANGELOG and README. Push to zerwiz/setup.
4. Add terminal block on homepage (WhyNotProductionsHomepage) if the tool should be curl-able from the site.

---

## 7. Where things live (in zerwiz/setup)

| Concern | Location |
|---------|----------|
| AI Dev Suite code | `ai-dev-suite/` (electron_app/, elixir_tui/, install.sh) |
| RAG code | `rag/` |
| Tool docs | `doc/<name>/` |
| Start scripts | `start-*.sh`, `run-tui.sh` |
| Install scripts | `ai-dev-suite/install.sh`, `ai-dev-suite/install-full.sh` |
| Changelog | `doc/CHANGELOG.md` |

---

When editing tools: work in zerwiz/setup, keep docs in sync, ensure system portability, push to zerwiz/setup.
