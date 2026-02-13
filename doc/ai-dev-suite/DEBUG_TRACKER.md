# AI Dev Suite – Problem Solving & Debug Tracker

Tracks issues encountered, fixes applied, and what remains unsolved. Use this to avoid repeating work and to hand off debugging context.

---

## How to Use This Doc

- **Problem** – Symptom the user sees
- **Root cause** – What we identified (or hypothesis)
- **Fix** – What was done
- **Status** – Done / Partial / Not done
- **Code/location** – Where the fix lives

---

## 1. "Cannot reach API" on startup

| Field | Details |
|-------|---------|
| **Problem** | Red banner: "Cannot reach API. Start it: ./start-ai-dev-suite-api.sh" when opening the Electron app |
| **Root cause** | Window opened before API was ready. Mix compile on first run takes 30–90s; fixed 4s delay was too short. |
| **Fix** | (a) Start script runs API in background first, polls up to 90s for readiness before starting Electron. (b) Electron polls API readiness before showing window. (c) When script starts API, sets `AI_DEV_SUITE_API_STARTED=1` so Electron skips spawning a second API. |
| **Status** | Done |
| **Code** | `start-ai-dev-suite-electron.sh`, `ai-dev-suite/electron_app/src/main/main.ts` (`waitForAPIReady`, `startElixirAPI`) |

---

## 2. "(no response)" – empty stream from Ollama

| Field | Details |
|-------|---------|
| **Problem** | Chat shows "(no response)" with debug link; stream completes but no content. |
| **Root cause** | (a) Large KB (e.g. Ai_Dev_Suite) can cause empty replies. (b) **Thinking:** Sending `think: true` to non-thinking models (qwen2.5-coder, llama3.1) caused empty responses. (c) First model load can be slow; user may give up too soon. |
| **Fix** | (a) "Try default KB" button when (no response) with non-default KB. (b) Disabled `think: true` entirely in backend (was only enabled for qwen3, deepseek-r1, etc., but still caused issues). (c) Debug checklist and START.md troubleshooting. |
| **Status** | Done for thinking; KB/load time are mitigations, not full fixes |
| **Code** | `ai_dev_suite_tui.ex` (`build_ollama_body` – think disabled), `Chat.tsx` (NoResponseDebug, Try default KB), `START.md` § Troubleshooting |

---

## 3. Stale "Cannot reach API" during retry

| Field | Details |
|-------|---------|
| **Problem** | User retries after API was down; old "Cannot reach API" banner stays visible during new in-flight request. |
| **Root cause** | Error state was only cleared on success, not when starting a new send. |
| **Fix** | Clear `error` when `handleSend` starts (before making the request). |
| **Status** | Done |
| **Code** | `Chat.tsx` `handleSend` – `setError(null)` at start |

---

## 4. Send button during streaming

| Field | Details |
|-------|---------|
| **Problem** | User could not abort a long response. |
| **Root cause** | No abort path for streaming request. |
| **Fix** | Send button becomes Stop during loading; Stop calls `AbortController.abort()`. `sendChatStream` accepts `abortSignal`; on abort calls `onDone()` not `onError()`. |
| **Status** | Done |
| **Code** | `Chat.tsx` (handleStop, abortControllerRef), `api.ts` (sendChatStream abortSignal) |

---

## 5. "Ollama – chat failing" (amber) when chat works

| Field | Details |
|-------|---------|
| **Problem** | Header shows "Ollama – chat failing" even after successful responses. |
| **Root cause** | `lastChatFailed` stuck true from an earlier failed request; not cleared when retry succeeds. |
| **Fix** | `setChatSucceeded()` called on first delta/thinking; clears `lastChatFailed`. Clearing error on new send also helps avoid confusing state. |
| **Status** | Done |
| **Code** | `Chat.tsx` onDelta/onThinking call `setChatSucceeded()`, `ChatContext.tsx` |

---

## 6. Ports 5174 / 41434 in use

| Field | Details |
|-------|---------|
| **Problem** | Stale processes hold ports; new start fails or behaves oddly. |
| **Root cause** | Previous Electron/API/Vite run left processes behind. |
| **Fix** | Start scripts kill processes on 5174 and 41434 before launching. |
| **Status** | Done |
| **Code** | `start-ai-dev-suite-electron.sh`, `start-ai-dev-suite-api.sh`, etc. |

---

## 7. Thinking breaking non-thinking models

| Field | Details |
|-------|---------|
| **Problem** | qwen2.5-coder, llama3.1 returned "(no response)" when thinking was enabled. |
| **Root cause** | `think: true` sent to models that don’t support it (Ollama docs: only qwen3, deepseek-r1, deepseek-v3, gpt-oss). |
| **Fix** | Disabled `think` in `build_ollama_body`. Documented in [THINKING.md](./THINKING.md) how to re-enable safely with model allowlist. |
| **Status** | Done (think disabled); re-enable later with proper model check |
| **Code** | `ai_dev_suite_tui.ex` `build_ollama_body` |

---

## 8. Quit leaves Ollama running

| Field | Details |
|-------|---------|
| **Problem** | Quitting app left Ollama (and other started processes) running. |
| **Root cause** | No cleanup on quit. |
| **Fix** | Electron calls `POST /api/ollama/stop` before killing API. Backend `stop_ollama()` kills Ollama if the app started it. |
| **Status** | Done |
| **Code** | `main.ts` (app quit handlers), `api_router.ex` `/api/ollama/stop`, `ai_dev_suite_tui.ex` `stop_ollama` |

---

## 9. Chat works in browser but not in Electron

| Field | Details |
|-------|---------|
| **Problem** | Chat works when opened in Cursor/browser (localhost:5174) but fails in Electron desktop app. |
| **Root cause** | Electron renderer can block fetch to localhost (CORS / web security). |
| **Fix** | (a) `webSecurity: false`. (b) **Main-process proxy:** Chat stream now goes via IPC → main process fetch → no CORS. `sendChatStream` uses `window.api.chatStream` when in Electron. |
| **Status** | Done |
| **Code** | `main.ts` (webSecurity: false, ipcMain `chat:stream`, `chat:stream:abort`), `preload.ts` (chatStream), `api.ts` (Electron path uses window.api.chatStream) |

---

## 10. "Error: abortSignal.addEventListener is not a function"

| Field | Details |
|-------|---------|
| **Problem** | Electron app shows this error; chat returns "(no response)". |
| **Root cause** | `AbortSignal` passed through IPC/context bridge is serialized and loses `addEventListener`. Preload received a plain object, not a real `AbortSignal`. |
| **Fix** | Remove `abortSignal` from `chatStream` params. Register abort listener in renderer (`api.ts`) where the real `AbortSignal` exists; on abort, call `window.api.chatStreamAbort()` to send `chat:stream:abort` IPC. |
| **Status** | Done |
| **Code** | `preload.ts` (chatStream no longer takes abortSignal; expose chatStreamAbort), `api.ts` (add abort listener in renderer, call chatStreamAbort), `vite-env.d.ts` (types) |

---

## 11. Debug observer for "(no response)"

| Field | Details |
|-------|---------|
| **Problem** | Hard to see what's happening when chat returns "(no response)" or "terminated". |
| **Fix** | `debugger/observer.sh` – tails API + Ollama logs, health checks every 10s, runs test chat on startup. `DEBUG=1 ./start-ai-dev-suite-electron.sh` spawns it in a second terminal. |
| **Status** | Done |
| **Code** | `debugger/observer.sh`, `start-ai-dev-suite-electron.sh` (DEBUG=1) |

---

## What Is NOT Done / Still Open

| Issue | Notes |
|-------|-------|
| Re-enable thinking for supported models | Documented in THINKING.md; needs model allowlist + tests with qwen3/deepseek-r1 |
| Stream sometimes empty with default KB | If "(no response)" persists with default KB, root cause unknown; may need backend/Ollama logs |
| Full startup failure (all clients) | Use two-terminal: `./start-ai-dev-suite-api.sh` then `AI_DEV_SUITE_API_STARTED=1 npm run dev`; see START.md § Manual |
| CORS/stream from Vite dev (5174) to API (41434) | CORS is configured; no confirmed issues reported |
| Model loading progress | First load can be slow; no progress indicator |

---

## Debug Checklists

### In-app (Chat.tsx DEBUG_STEPS)

Shown when user sees "(no response)" and clicks **debug**:

1. Try KB: default — large KB can cause empty replies  
2. First model load can be slow; wait and retry  
3. Ollama running? Click ↻ Refresh  
4. Run app from terminal to see API logs  
5. Port 41434 free? Kill other API instances  
6. `curl -s http://localhost:41434/api/ollama/models`  
7. `curl -s http://localhost:11434/api/tags`  
8. `ollama list` — model exists?  
9. `ollama run MODEL hello` — direct test  
10. `mix deps.get && mix compile` in elixir_tui  
11. Firewall/VPN blocking localhost?  
12. Model too large? Try smaller model  

### Manual API test

```bash
# API reachable?
curl -s http://localhost:41434/api/ollama/models

# Ollama reachable?
curl -s http://localhost:11434/api/tags

# Stream (first time may be slower)
curl -s -N -X POST http://localhost:41434/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen2.5-coder:14b","messages":[{"role":"user","content":"hi"}],"knowledge_base":"default"}'
```

### Logs

| Log | Path / where |
|-----|--------------|
| API stdout/stderr | Terminal if run from script; or `/tmp/ai-dev-suite-api.log` when script starts API |
| Ollama | `/tmp/ollama.log` when started by script |

---

## Related Docs

- [START.md](./START.md) – Quick start and troubleshooting  
- [THINKING.md](./THINKING.md) – Thinking models, API, re-enable guide  
- [FUNCTIONS.md](./FUNCTIONS.md) – API and feature reference  
