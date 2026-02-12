# Agent Communication – Functional Flow

This document traces how a user message flows from the Chat UI to the AI model (Ollama) and back. It describes the functional structure and data flow.

---

## Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌─────────────┐
│  Chat UI    │────▶│  API (Elixir)    │────▶│  Ollama     │────▶│  Response   │
│  (React)    │     │  localhost:41434 │     │  :11434     │     │  (stream)   │
└─────────────┘     └──────────────────┘     └─────────────┘     └─────────────┘
       │                      │                      │
       │   Browser: fetch     │   curl POST          │   JSON lines
       │   Electron: IPC →    │   /api/chat          │   (delta, thinking,
       │   main fetch         │   (Ollama proxy)    │    done, error)
       ▼                      ▼                      ▼
```

**Three layers:**
1. **Frontend** – Chat.tsx → api.ts (Electron uses preload IPC; browser uses direct fetch)
2. **API** – Elixir Plug router → AiDevSuiteTui → curl to Ollama
3. **Ollama** – Runs the model, streams JSON lines back

---

## End-to-end flow (streaming)

### 1. User sends message (Chat.tsx)

- User types and clicks Send.
- `handleSend()` builds messages, creates `AbortController`, calls `sendChatStream()`.
- Empty assistant message is appended; content is filled via callbacks.

### 2. Request body construction (api.ts `sendChatStream`)

Body sent to the API:

```json
{
  "model": "llama3.1:latest",
  "messages": [{"role": "user", "content": "hi"}, ...],
  "knowledge_base": "Ai_Dev_Suite",
  "options": {"temperature": 0.7},
  "internet_enabled": true
}
```

- `knowledge_bases` / `knowledge_base` – which KB(s) to use for system prompt
- `options` – temperature, num_predict, etc.
- `internet_enabled` – whether to run web search and inject results before calling the model

### 3. Transport path (Browser vs Electron)

| Context  | Path                                           | Reason                    |
|----------|-------------------------------------------------|---------------------------|
| **Browser** | `fetch(API_BASE + /api/chat/stream)`           | Direct HTTP               |
| **Electron** | `window.api.chatStream(body, callbacks)`       | Renderer fetch can hit CORS; main process avoids it |
| **Electron abort** | `window.api.chatStreamAbort()` → IPC          | AbortSignal cannot cross context bridge |

Electron flow: `api.ts` → `preload.chatStream` → IPC `chat:stream` → `main.ts` fetch → API.

### 4. API route (api_router.ex `POST /api/chat/stream`)

- Parses `model`, `messages`, `knowledge_bases` / `knowledge_base`, `options`, `internet_enabled`.
- Builds **system prompt** from:
  - **Memory** – RAG memory content
  - **Behavior** – identity/style instructions
  - **Knowledge base** – drive index (KB docs)
- Prepends system message: `[%{"role" => "system", "content" => system} | messages]`.
- Sets `Content-Type: application/x-ndjson; charset=utf-8` (JSON lines).
- Spawns a process that calls `AiDevSuiteTui.api_chat_send_stream(model, all, callback, opts, internet_enabled)`.
- `stream_chat_loop` receives `{:stream_chunk, data}` and sends chunks with `Plug.Conn.chunk/2`.

### 5. System prompt build (api_build_system_prompt)

```
api_build_system_prompt(kb) →
  load_knowledge_base_index(kb)  → drive_index (KB doc summaries)
  load_rag_memory()              → memory (user preferences, system info)
  load_behavior()                → behavior (identity, style)
  api_build_system_prompt_impl(drive_index)
```

The system prompt combines:
- Base instructions (memory, behavior, /research hint)
- Drive index if KB is not default
- Model-tagging note if memory has model tags

### 6. Internet / research injection (maybe_inject_research)

When `internet_enabled == true`:
- Takes the **last user message**.
- Calls `run_research(query)`:
  - Runs `rag research <query> --context-only` (duckduckgo-search + trafilatura).
  - Returns web context only (no Ollama call in RAG).
- Replaces that user message with:
  - `[Web search succeeded. Use the following context. ...]\n\n<results>\n\n---\n\n<original query>`
  - Or `[Note: Web search failed...]\n\n<original query>` on error.

So the model sees a single user message that already contains web context.

### 7. Ollama stream (ollama_chat_stream)

- Builds body with `build_ollama_body(model, messages, true, options)`.
- Writes body to temp file, runs:
  ```bash
  curl -N -s --max-time 300 -X POST http://localhost:11434/api/chat \
    -H 'Content-Type: application/json' -d @/tmp/ollama_stream_*.json
  ```
- Reads stdout line-by-line (NDJSON).
- Parses each line and calls callback with:
  - `:thinking` – `message.thinking` (thinking-capable models; currently disabled)
  - `:delta` – `message.content`
  - `:done` – `done: true`
  - `:error` – `error` field

### 8. Streaming format (NDJSON)

Each line is one JSON object:

```
{"thinking": "..."}
{"delta": "Hello"}
{"delta": "!"}
{"done": true}
{"error": "..."}
```

API forwards these as chunks; frontend parses and updates the UI.

### 9. Frontend handling of stream

- **Browser:** `fetch` → `res.body.getReader()` → read chunks → split by `\n` → `JSON.parse(line)` → callbacks.
- **Electron:** Main process does the same, sends `chat:stream:chunk`, `chat:stream:done`, `chat:stream:error` via IPC; preload forwards to `onChunk` / `onDone` / `onError`.

Callbacks in Chat.tsx:
- `onDelta` → append to last assistant message
- `onThinking` → append to thinking section (if enabled)
- `onDone` → set loading false, clear abort controller
- `onError` → show error banner

### 10. Abort (Stop button)

- Chat creates `AbortController` before each send.
- **Browser:** `fetch(..., { signal: abortController.signal })`.
- **Electron:** `abortSignal.addEventListener('abort', () => window.api.chatStreamAbort())`; main process holds an `AbortController` for the fetch and aborts it on `chat:stream:abort` IPC.

---

## Non-streaming path (`POST /api/chat`)

Used when streaming is not needed (e.g. ACP adapter, simple integrations):
- Same system prompt and research injection.
- Calls `ollama_chat` (single curl, no stream).
- Returns `{reply: content}` when done.

---

## Key functions by layer

| Layer   | File                 | Function                | Role                                          |
|---------|----------------------|-------------------------|-----------------------------------------------|
| UI      | Chat.tsx             | handleSend              | Build messages, call sendChatStream, handle callbacks |
| API client | api.ts            | sendChatStream          | Build body, choose Electron vs browser path  |
| Preload | preload.ts           | chatStream              | IPC bridge for Electron                       |
| Main    | main.ts              | chat:stream handler     | Main-process fetch for Electron               |
| API     | api_router.ex         | POST /api/chat/stream   | Parse body, build system, spawn stream worker  |
| API     | api_router.ex         | stream_chat_loop        | Receive chunks, send to client                |
| Backend | ai_dev_suite_tui.ex  | api_chat_send_stream     | Ensure Ollama up, maybe_inject_research, stream |
| Backend | ai_dev_suite_tui.ex  | api_build_system_prompt  | Build system from memory, behavior, KB        |
| Backend | ai_dev_suite_tui.ex  | maybe_inject_research    | Web search, inject into last user message     |
| Backend | ai_dev_suite_tui.ex  | ollama_chat_stream       | curl to Ollama, parse NDJSON, callback        |
| Backend | ai_dev_suite_tui.ex  | build_ollama_body        | Model, messages, stream:true, options         |

---

## Data flow summary

```
User input
  → messages + KB + options + internet_enabled
  → POST /api/chat/stream

API:
  system = api_build_system_prompt(KB)   # memory + behavior + drive index
  all = [system | messages]
  all = maybe_inject_research(all)        # if internet_enabled
  ollama_chat_stream(model, all, callback, options)

Ollama:
  curl POST localhost:11434/api/chat
  body = {model, messages, stream: true, options}

Stream back:
  Ollama NDJSON → callback(:thinking|:delta|:done|:error)
  → API chunk → HTTP chunked response
  → Frontend parse → onDelta/onThinking/onDone/onError
  → Chat UI update
```

---

## Related docs

- [FUNCTIONS.md](./FUNCTIONS.md) – API endpoints and module overview
- [THINKING.md](./THINKING.md) – Thinking tokens (currently disabled)
- [DEBUG_TRACKER.md](./DEBUG_TRACKER.md) – Issues and fixes
