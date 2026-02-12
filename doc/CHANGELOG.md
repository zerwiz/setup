# Changelog – zerwiz/setup (Tools)

All notable changes to the tools (AI Dev Suite, RAG, Workshop Setup) are documented here.  
Update this file **before** every commit that changes behavior, content, or deployment.

Format: list entries under a date/version heading; use present tense (“Add …”, “Fix …”).

---

## [Unreleased]

- Add doc/CURL_INSTALLS.md – all curl install commands for homepage; copy-paste ready; use zerwiz/setup URLs so visitors can install.
- Remove homepage sync – delete sync script, HOMEPAGE_*.md, SYNC_TO_HOMEPAGE.md. This repo is AI Dev Suite tools only; homepage lives in a separate repo.
- Debugger: read and write files – Edit file section (Choose file, Read, Write); path restricted to project root or ~/.config/ai-dev-suite; analysis/chat prompts mention file edits; user approves all changes.
- Suite ↔ Debugger communication – Suite can ask debugger for fix suggestions; "Get debug help" / "Debug help" in Chat (error banner and (no response)); A2A adapter REST /api/analyze; Suite API proxy /api/debugger/ask; A2A starts with Suite so "Get debug help" works by default.
- Debugger: read AI Suite logs and terminals – A2A, RAG, Electron/suite terminal; log selector dropdown (Ollama | A2A | RAG | Electron); all logs sent to analysis and chat; `start-ai-dev-suite-electron.sh` tees npm run dev output to `/tmp/ai-dev-suite-electron.log`.
- Debugger start scripts: free port 5175 if in use before starting (fixes "Port 5175 is already in use").
- Debugger: model selector – choose any installed Ollama model for chat and analysis; dropdown in header.
- Debugger: fix model resolution – use actual model name from /api/tags, not preferred when only family matches (fixes 404 when qwen2.5-coder:3b not found but e.g. llama3.2 is installed).
- Debugger: resolve Ollama model from /api/tags when default missing (fixes chat 404); add "Free port 11434" when bind error in log; allow fuser, lsof, kill in Run fix; better chat error messages.
- Debugger Run fix: add "Choose file" button to select a script to run.
- Add doc/ai-dev-suite/DEBUGGER_CAPABILITIES.md – full capabilities reference for the debugger.
- Debugger: start API/Ollama from UI when down; run fix commands (ollama, mix, npm, bash) with user approval.
- Debugger: auto-detect problems (down services, log errors, test failures) and show "Get fix suggestions" button; analysis prompt asks for Problem → Suggestion format.
- Debugger: chat interface – converse with the debugger; each message includes system context (processes, logs, files) so it can answer with full visibility.
- Debugger: system visibility – see processes (ollama, node, beam…), terminals, and files (config, logs, project); all sent to qwen2.5-coder for analysis. Suggestions only – no fixes applied without user approval.
- Debugger memory (RAG-style): stores every fix qwen2.5-coder suggests in `~/.config/ai-dev-suite/debugger_memory.md`; past fixes are injected into the analysis prompt so the model can reuse prior solutions; "Past fixes" panel in the UI.
- Debug observer: uses qwen2.5-coder:3b to analyze output and suggest fixes; override with DEBUG_MODEL.
- Add start-ai-dev-suite-debugger.sh – full debugger start (API + Ollama + UI); DEBUG=1 adds observer + A2A.
- Add debugger Electron UI (electron-app/) – status, logs, test chat, qwen2.5-coder analysis. Run: ./start-ai-dev-suite-debugger-ui.sh
- Add doc/ai-dev-suite/DEBUGGER.md – full debugger documentation (observer, A2A, usage, troubleshooting).
- Debugger: move to `debugger/` folder – `observer.sh`, `start-a2a.sh`, `a2a-adapter/`.
- Debug observer: A2A (Google Agent2Agent) support – a2a-adapter exposes status/logs/analysis via A2A; DEBUG=1 starts it. Agent card: http://localhost:41435/.well-known/agent-card.json
- Add debugger/observer.sh and DEBUG=1 mode: tails API/Ollama logs, health checks, test chat in a second terminal to debug "(no response)".
- Add doc/ai-dev-suite/AGENT_COMMUNICATION.md – functional flow from Chat UI to Ollama: layers, streaming, system prompt, research injection, abort.
- start-ai-dev-suite-electron.sh: when starting Ollama, open it in a visible terminal; OLLAMA_TERMINAL=1 forces a terminal even when Ollama already running. doc/ai-dev-suite/OLLAMA_TERMINAL.md – why no terminal opens and how to fix.
- Fix: abortSignal.addEventListener error in Electron – move abort listener to renderer (api.ts) and use chatStreamAbort IPC; preload no longer receives AbortSignal (context bridge serializes and breaks it).
- Update structure and docs for current repo layout: zerwiz/setup is the tools repo (no tools/ subfolder); for-zerwiz-setup syncs to homepage; fix doc/STRUCTURE.md, README, for-zerwiz-setup/, doc/SYNC_TO_HOMEPAGE.md, doc/README.md, TOOLS_README.md; sync script default path to WhyNotProductionsHomepage.
- setup.sh and run-tui.sh: fetch from zerwiz/setup instead of WhyNotProductionsHomepage; look for ai-dev-suite/elixir_tui at repo root.
- install-full.sh, install-ai-dev-suite.sh: default REPO to zerwiz/setup; support ai-dev-suite at root (setup-main).
- Scripts and docs: update paths from tools/ to repo root (rag/, ai-dev-suite/); install.sh curl URLs to zerwiz/setup; Elixir RAG path candidates and error messages; doc paths; electron_app repo and publish config.
- AI Dev Suite: structure-agnostic RAG discovery – env AI_DEV_SUITE_RAG_SCRIPT or walk-up from cwd; no hardcoded folder layout; doc STORAGE.md and FUNCTIONS.md.
- Add .cursor/rules/ai-dev-suite-paths.mdc – rule for structure-agnostic path discovery in AI Dev Suite.
- README: Add alpha/collaboration call-out above About me.
- README About: Add Workflowspace, AffiliateFlow, NorthStarOS to Areas table.
- Verify startup scripts work; fix START.md path (WhyNotProductions → setup); ensure scripts executable.
- Verify install scripts work; install-full.sh tested via curl; sync for-zerwiz-setup install-full comment.
- start-ai-dev-suite-electron.sh: run npm install if node_modules missing (fixes concurrently not found crash).
- API: handle port-in-use gracefully instead of MatchError crash; clear message to stop other process.
- Vite: strictPort 5174 so Electron and Vite stay in sync when port is taken.
- Start scripts: free ports 5174 and 41434 if in use before launching (Electron, web, API).
- API: suppress "No module named pip" when ensuring RAG deps (non-fatal, stderr redirected).
- Chat UI: show AI thought process (thinking tokens) for thinking-capable models (e.g. qwen3, deepseek-r1). Enable with `think: true` in stream.
- Chat UI: error banner stays until success or manual dismiss; "(no response)" when AI returns empty; dismiss button on errors.
- Chat UI: expandable "debug" checklist when (no response). START.md: expanded troubleshooting (12 items).
- Start scripts: auto-start Ollama if not running (electron, web, api). Refresh button always labeled "↻ Refresh".
- Chat: preload selected model when Chat is shown or model changes (faster first response). POST /api/ollama/load.
- Header: show "Ollama – chat failing" (amber) when list works but chat returns no response. Green only when chat succeeds.
- Fix: only send `think: true` for thinking-capable models (qwen3, deepseek-r1, deepseek-v3, gpt-oss). Fixes "(no response)" with llama3.1 and other non-thinking models.
- Chat is now the default landing page (/). Home moved to /home.
- Chat: auto-scroll to bottom on new messages and during streaming (fixes scroll position lag).
- Chat: Send button becomes Stop during streaming; clicking Stop aborts the response.
- Chat: clear stale error banner when user retries (avoids "Cannot reach API" showing during a new in-flight request).
- Electron: poll API readiness before showing window (avoids "Cannot reach API" on startup).
- start-ai-dev-suite-electron.sh: start API before Electron, wait up to 90s for ready; Electron skips spawning when AI_DEV_SUITE_API_STARTED=1.
- Chat: "Try default KB" button when (no response) with non-default KB; reordered debug checklist.
- doc/ai-dev-suite/THINKING.md – guide for extended thinking: Ollama API, supported models, best practices, integration notes.
- doc/ai-dev-suite/DEBUG_TRACKER.md – problem-solving log: issues, fixes applied, what’s open, debug checklists.
- Electron: webSecurity: false; chat stream via main-process proxy (IPC) when in Electron – bypasses renderer fetch/CORS.
- start-ai-dev-suite-electron.sh: better API readiness check (accept HTTP 200/500); wait up to 120s; progress every 10s.
- START.md: two-terminal manual flow when start script fails; AI_DEV_SUITE_API_STARTED=1 npm run dev.
- Quit: stop Ollama when app quits (if we started it). POST /api/ollama/stop; Electron calls before killing API.
- Update README About section with expanded bio: Zerwiz identity, education, AI Dev Suite, WhyNot Productions, UpsideDown Production, principles, network, contact.
- Add CHANGELOG. zerwiz/setup is the main repo for tools; develop here.
