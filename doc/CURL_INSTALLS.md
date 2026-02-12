# Curl Install Commands – Homepage Reference

All install commands for [whynotproductions.netlify.app](https://whynotproductions.netlify.app/).  
**Use these exact URLs on the homepage** so visitors can install the suite and tools.

Scripts live in **zerwiz/setup**. URLs must point to `raw.githubusercontent.com/zerwiz/setup/main/`.

---

## AI Dev Suite Scripts (zerwiz/setup)

| Label | Command | Description |
|-------|---------|-------------|
| **Full Install** | `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install-full.sh \| bash` | Installs Electron, TUI, API. Launchers: `ai-dev-suite-electron`, `ai-dev-suite-tui`, `ai-dev-suite-api`, `ai-dev-suite-web`. |
| **TUI Only** | `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-tui.sh \| bash` | Quick run, no permanent install. macOS/Linux. |
| **AI Dev Tools** | `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh \| bash` | Display or install Zed, OpenCode, Ollama, LM Studio, OpenClaw, Workshop. |
| **Install one tool** | `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh \| bash -s ollama` | Add tool name: `ollama`, `zed`, `opencode`, `lm`, `openclaw`, `workshop` |
| **Workshop Setup** | `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh \| bash` | Installs Node.js, Git, Elixir, and AI Dev Suite TUI. |

---

## Individual Tools (external)

| Tool | Command |
|------|---------|
| **Zed** | `curl -fsSL https://zed.dev/install.sh \| sh` |
| **OpenCode** | `curl -fsSL https://opencode.ai/install \| bash` |
| **Ollama** | `curl -fsSL https://ollama.com/install.sh \| sh` |
| **LM Studio** | `curl -fsSL https://lmstudio.ai/install.sh \| bash` |
| **OpenClaw** | `curl -fsSL https://openclaw.ai/install.sh \| bash` |
| **Workshop Setup** | `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh \| bash` |

---

## Copy-paste for homepage

**AI Dev Suite – Full Install:**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install-full.sh | bash
```

**AI Dev Suite – TUI Only:**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-tui.sh | bash
```

**AI Dev Tools (display / install):**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash
```

**Workshop Setup:**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh | bash
```

---

## Important

- **Source:** All AI Dev Suite scripts live in [zerwiz/setup](https://github.com/zerwiz/setup). Do **not** point to WhyNotProductionsHomepage.
- **Homepage:** Update [whynotproductions.netlify.app](https://whynotproductions.netlify.app/) to use these `zerwiz/setup` URLs so installs work for visitors.
- **Shareable:** [whynotproductions.netlify.app/install](https://whynotproductions.netlify.app/install) for install commands page.
