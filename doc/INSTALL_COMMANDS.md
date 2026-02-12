# Terminal Install Commands – WhyNot Productions

Copy-paste commands for AI Dev Suite and tools. Share: **https://whynotproductions.netlify.app/install**

---

## AI Dev Suite – Full Install (Electron + TUI + API)

Installs to `~/.local/share/ai-dev-suite`. Creates launchers: `ai-dev-suite-electron`, `ai-dev-suite-tui`, `ai-dev-suite-api`, `ai-dev-suite-web`.

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install-full.sh | bash
```

**After install:** Run `ai-dev-suite-electron` (desktop app), `ai-dev-suite-tui` (terminal menu), or `ai-dev-suite-debugger` (logs, fix suggestions).

---

## AI Dev Suite – Debugger (Quick Run)

Downloads and starts the debugger (API + Ollama + Debugger UI). Diagnose "(no response)", view logs, get fix suggestions.

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-debugger.sh | bash
```

---

## AI Dev Suite – Observer (Quick Run)

Terminal observer. Tails API + Ollama logs, health checks every 10s. Use when Suite shows "(no response)".

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-observer.sh | bash
```

---

## AI Dev Suite – TUI Only (Quick Run)

Downloads and runs the terminal menu. No permanent install. macOS/Linux.

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/run-tui.sh | bash
```

---

## Workshop Setup

Installs Node.js, Git, Elixir, and the AI Dev Suite TUI.

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh | bash
```

---

## AI Dev Tools (Display or Install)

Shows install commands for Zed, OpenCode, Ollama, LM Studio, OpenClaw, Workshop. Add a tool name to install directly.

```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash
```

**Install a specific tool:**
```bash
curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/ai-dev-suite/install.sh | bash -s ollama
```
Options: `zed`, `opencode`, `ollama`, `lm`, `openclaw`, `workshop` (or `1`–`6`).

---

## Individual Tool Installs

| Tool | Command |
|------|---------|
| **Zed** | `curl -fsSL https://zed.dev/install.sh \| sh` |
| **OpenCode** | `curl -fsSL https://opencode.ai/install \| bash` |
| **Ollama** | `curl -fsSL https://ollama.com/install.sh \| sh` — GPU: use official install; AMD Linux add ROCm (see [OLLAMA_GPU.md](./ai-dev-suite/OLLAMA_GPU.md)) |
| **LM Studio** | `curl -fsSL https://lmstudio.ai/install.sh \| bash` |
| **OpenClaw** | `curl -fsSL https://openclaw.ai/install.sh \| bash` |
| **Workshop Setup** | `curl -fsSL https://raw.githubusercontent.com/zerwiz/setup/main/setup.sh \| bash` |

---

## Shareable Links

| Page | URL |
|------|-----|
| Install commands | https://whynotproductions.netlify.app/install |
| Homepage | https://whynotproductions.netlify.app |
| Courses | https://whynotproductions.netlify.app/courses |
| Contact | https://whynotproductions.netlify.app/contact |
| Book a call | https://cal.com/whynotproductions |
| Discord | https://discord.com/invite/p74cGwrdPd |

---

*WhyNot Productions · zerwiz · whynotproductions.netlify.app*
