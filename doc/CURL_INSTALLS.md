# Curl Install Commands – Homepage Reference

All install commands for [whynotproductions.netlify.app](https://whynotproductions.netlify.app/).  
**Use these exact URLs on the homepage** so visitors can install the suite and tools.

Scripts live in **zerwiz/setup**. URLs must point to `raw.githubusercontent.com/zerwiz/setup/main/`.

---

## AI Dev Suite Scripts (zerwiz/setup)

| Label | Command | Description |
|-------|---------|-------------|
| **Full Install** | `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install-full.sh \| bash` | Installs Electron, TUI, API, Debugger. Launchers: `ai-dev-suite-electron`, `ai-dev-suite-tui`, `ai-dev-suite-api`, `ai-dev-suite-web`, `ai-dev-suite-debugger`, `ai-dev-suite-and-debugger`. |
| **TUI Only** | `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-tui.sh \| bash` | Quick run, no permanent install. macOS/Linux. |
| **Debugger** | `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-debugger.sh \| bash` | Quick run. API + Ollama + Debugger UI. Diagnose "(no response)", logs, fix suggestions. |
| **Observer** | `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-observer.sh \| bash` | Terminal observer. Tails API + Ollama logs, health checks. Use when Suite shows "(no response)". |
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

**Debugger (quick run):**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-debugger.sh | bash
```

**Observer (terminal, quick run):**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-observer.sh | bash
```

---

## Share blocks (correct URLs)

Use these blocks on homepage, share pages, or anywhere install commands are displayed. **All URLs must point to zerwiz/setup** (not WhyNotProductionsHomepage). Format: title, short info, then `$` + curl command.

**AI Dev Suite – Full Install**

Electron app, TUI, API, and Debugger. Installs to ~/.local/share/ai-dev-suite. Launchers: ai-dev-suite-electron, ai-dev-suite-tui, ai-dev-suite-debugger.
```
$ curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install-full.sh | bash
```

**AI Dev Suite – TUI Only**

Quick run. Downloads and starts terminal menu. No permanent install. macOS/Linux.
```
$ curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-tui.sh | bash
```

**AI Dev Suite – Debugger**

Quick run. API + Ollama + Debugger UI. Diagnose "(no response)", view logs, get fix suggestions. No permanent install.
```
$ curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-debugger.sh | bash
```

**AI Dev Suite – Observer**

Quick run. Tails API + Ollama logs, health checks. Use when Suite shows "(no response)". No permanent install.
```
$ curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-observer.sh | bash
```

**Workshop Setup**

Installs Node.js, Git, Elixir, and AI Dev Suite TUI.
```
$ curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh | bash
```

**AI Dev Tools (display or install)**

Shows install commands for Zed, OpenCode, Ollama, LM Studio, OpenClaw, Workshop. Add tool name to install: `| bash -s ollama`
```
$ curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash
```

---

## Important

- **Source:** All AI Dev Suite scripts live in [zerwiz/setup](https://github.com/zerwiz/setup). Do **not** point to WhyNotProductionsHomepage.
- **Homepage:** Update [whynotproductions.netlify.app](https://whynotproductions.netlify.app/) to use these `zerwiz/setup` URLs so installs work for visitors.
- **Shareable:** [whynotproductions.netlify.app/install](https://whynotproductions.netlify.app/install) for install commands page.
