# Zed & OpenCode Integration via ACP

Full implementation guide for connecting the AI Dev Suite to **Zed** and **OpenCode** via the **Agent Client Protocol (ACP)**. This allows users to use the AI Dev Suite (Ollama, memory, knowledge bases) directly inside their code editor.

---

## Local agents for code IDEs

**The AI Dev Suite is built to run agents locally.** All inference happens on your machine:

- **Ollama** runs LLMs locally; no code is sent to external APIs
- **ACP adapter** runs as a subprocess launched by your IDE
- **Data stays on disk** — memory, behavior, knowledge bases live in `~/.config/ai-dev-suite/`

This design ensures the system works with code IDEs (Zed, OpenCode, JetBrains, Neovim) without cloud dependencies. Your code never leaves your machine.

---

## 1. Overview

### What is ACP?

The [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) is an open standard (Apache 2.0) that standardizes communication between code editors and AI coding agents. Similar to how LSP connects editors to language servers, ACP connects editors to AI agents.

- **Client** = Code editor (Zed, OpenCode, JetBrains IDEs, Neovim via plugins)
- **Agent** = AI coding assistant (what we implement)

Editors that support ACP can connect to any ACP-compatible agent. The AI Dev Suite becomes such an agent.

### Transport: stdio

ACP uses **JSON-RPC over stdio**:

- The editor **launches the agent as a subprocess**
- The agent **reads** JSON-RPC messages from `stdin` (newline-delimited)
- The agent **writes** JSON-RPC messages to `stdout`
- The agent **may** write logs to `stderr`

No embedded newlines in messages. UTF-8 encoding.

### What we need to build

An **ACP adapter** that:

1. Speaks ACP (JSON-RPC over stdio)
2. Proxies requests to the AI Dev Suite HTTP API (`http://localhost:41434`)
3. Can be launched by Zed/OpenCode via `command` + `args`

The adapter is a small process (e.g. Node.js/TypeScript) that sits between the editor and the existing Elixir API.

---

## 2. Prerequisites

All components run **locally**; no cloud services are required for core chat.

### Required

| Component | Purpose |
|-----------|---------|
| **AI Dev Suite API** | Must be running at `http://localhost:41434`. Start with `./start-ai-dev-suite-api.sh` or via the Electron app. |
| **Ollama** | Runs LLMs locally at `http://localhost:11434`. Your code stays on your machine. |
| **Node.js 18+** | For the ACP adapter (if implemented in TypeScript/Node). |
| **Zed** or **OpenCode** | ACP-compatible code IDE. |

### Optional

- **Elixir** – The API is Elixir; the adapter only needs HTTP.
- **RAG / web research** – If the user enables Internet in chat, Python + deps are needed (installed by start scripts).

---

## 3. ACP Protocol Summary

### Initialization

1. Client sends `initialize` request
2. Agent responds with capabilities (e.g. `promptCapabilities`, `toolCallCapabilities`)

### Session setup

1. Client sends `session/create` or similar
2. Agent establishes session and returns `sessionId`

### Prompt turn (main chat flow)

1. Client sends `session/prompt` with `sessionId` and `prompt` (content blocks: text, files, etc.)
2. Agent processes the prompt (calls LLM via AI Dev Suite API)
3. Agent sends `session/update` notifications:
   - `agent_message_chunk` – streaming text from the model
   - `tool_call` / `tool_call_update` – if model requests tools
4. Agent responds to `session/prompt` with `result: { stopReason: "end_turn" }` when done

### Schema and libraries

- **Spec:** https://agentclientprotocol.com/
- **TypeScript SDK:** `@agentclientprotocol/sdk` – `AgentSideConnection` for implementing agents
- **Reference:** [Gemini CLI](https://github.com/google-gemini/gemini-cli), [OpenCode](https://github.com/sst/opencode)

---

## 4. AI Dev Suite API (existing)

The API already provides what the adapter needs:

| Endpoint | Purpose for ACP |
|----------|------------------|
| `POST /api/chat` | Non-streaming chat. Send `{ model, messages, knowledge_bases }`, get `{ reply }`. |
| `POST /api/chat/stream` | Streaming chat. Returns NDJSON: `{ delta }`, `{ thinking }`, `{ done }`, `{ error }`. |
| `GET /api/ollama/models` | List models for model selection. |
| `POST /api/ollama/start` | Ensure Ollama is running. |
| `GET /api/knowledge-bases` | List KBs for context selection. |
| `GET /api/memory` | Combined memory (for system prompt). |
| `GET /api/behavior` | Behavior instructions. |

The API builds the system prompt from memory, behavior, and knowledge bases. The adapter just forwards the conversation.

---

## 5. Implementation Architecture

### Option A: TypeScript ACP adapter (recommended)

```
┌─────────────────────────────────────────────────────────────┐
│  Zed / OpenCode (ACP Client)                                 │
│  - Launches: ai-dev-suite-acp (or node acp-adapter.js)       │
└─────────────────────────┬───────────────────────────────────┘
                          │ stdio (JSON-RPC)
┌─────────────────────────▼───────────────────────────────────┐
│  ACP Adapter (Node.js / TypeScript)                          │
│  - Uses @agentclientprotocol/sdk AgentSideConnection         │
│  - Handles: initialize, session/create, session/prompt       │
│  - Maps session/prompt → HTTP POST to API                    │
│  - Maps API stream → session/update agent_message_chunk       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP
┌─────────────────────────▼───────────────────────────────────┐
│  AI Dev Suite API (Elixir, port 41434)                       │
│  - POST /api/chat, /api/chat/stream                          │
│  - Uses Ollama, memory, behavior, knowledge bases            │
└─────────────────────────────────────────────────────────────┘
```

### Project structure

```
ai-dev-suite/
├── acp-adapter/                 # NEW: ACP adapter
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts            # Entry: read stdin, write stdout
│   │   ├── agent.ts            # AgentSideConnection + handlers
│   │   └── api.ts              # HTTP client for localhost:41434
│   └── dist/                   # Compiled JS
├── elixir_tui/
├── electron_app/
└── ...
```

### Adapter responsibilities

1. **Initialize** – Advertise capabilities (text prompts, optionally file content via `resource` blocks).
2. **Session create** – Generate `sessionId`, optionally preload default model/KB from env.
3. **Session prompt** – For each `session/prompt`:
   - Extract text and file content from `prompt` blocks
   - Build `messages` array (user message + optional file context)
   - POST to `http://localhost:41434/api/chat/stream` (prefer streaming)
   - For each `{ delta }` chunk, send `session/update` with `agent_message_chunk`
   - On `{ done }`, respond to `session/prompt` with `stopReason: "end_turn"`
4. **Error handling** – If API is down, return clear error. Handle `session/cancel`.

---

## 6. Zed Configuration

Once the adapter is built, add to **`~/.config/zed/settings.json`** (create the file if missing):

```json
{
  "agent_servers": {
    "AI Dev Suite": {
      "command": "node",
      "args": ["/path/to/acp-adapter/dist/index.js"]
    }
  }
}
```

**Paths by install method:**
- **From repo:** `ai-dev-suite/acp-adapter/dist/index.js` (use absolute path)
- **From install-full.sh:** `~/.local/share/ai-dev-suite/acp-adapter/dist/index.js` (or `$XDG_DATA_HOME/ai-dev-suite/acp-adapter/dist/index.js`)
- **From repo root:** `./start-ai-dev-suite-acp.sh` runs the adapter (stdio)

Or if you add a CLI wrapper (e.g. `ai-dev-suite-acp` in PATH):

```json
{
  "agent_servers": {
    "AI Dev Suite": {
      "command": "ai-dev-suite-acp",
      "args": []
    }
  }
}
```

### Opening the agent

- **Command Palette** → `agent: new thread`
- Or bind a key in `keymap.json`, e.g. `agent::NewExternalAgentThread` with `agent.custom.name: "AI Dev Suite"`

---

## 7. OpenCode Configuration

OpenCode can act as an **ACP client** (editor) or **ACP agent** (assistant). Here we use OpenCode as the **editor** and the AI Dev Suite as the **agent**.

**Status (as of 2025):** OpenCode [ACP docs](https://opencode.ai/docs/acp/) describe OpenCode *as* the agent (how Zed/JetBrains connect via `opencode acp`). No published docs yet for OpenCode as an ACP *client* connecting to external agents.

### If OpenCode adds custom agent support

If OpenCode adopts the same `agent_servers` pattern used by Zed and JetBrains, configuration would likely look like:

```json
{
  "agent_servers": {
    "AI Dev Suite": {
      "command": "node",
      "args": ["/path/to/acp-adapter/dist/index.js"]
    }
  }
}
```

Or with a launcher in PATH: `"command": "ai-dev-suite-acp"`, `"args": []`.

### Where to check for updates

| Resource | URL |
|----------|-----|
| OpenCode ACP | https://opencode.ai/docs/acp/ |
| OpenCode config | https://open-code.ai/docs/config |
| OpenCode GitHub | https://github.com/anomalyco/opencode |

### Use today

**Zed** and **JetBrains IDEs** support custom ACP agents. Use those with the AI Dev Suite adapter until OpenCode documents client-side agent configuration.

---

## 8. Implementation Steps (TypeScript)

### Step 1: Create the adapter project

```bash
mkdir -p ai-dev-suite/acp-adapter/src
cd ai-dev-suite/acp-adapter
npm init -y
npm install @agentclientprotocol/sdk
npm install -D typescript @types/node
```

### Step 2: Implement stdio transport

Use the SDK’s `ndJsonStream` or equivalent to read/write newline-delimited JSON over stdin/stdout:

```ts
import { createReadStream, createWriteStream } from 'fs';
import { ndJsonStream } from '@agentclientprotocol/sdk';  // or equivalent

const readStream = ndJsonStream(process.stdin);
const writeStream = ndJsonStream(process.stdout);
```

### Step 3: Implement AgentSideConnection

Create an `Agent` handler that:

- Handles `initialize` → return capabilities
- Handles `session/create` or equivalent → return `sessionId`
- Handles `session/prompt`:
  - Call `fetch('http://localhost:41434/api/chat/stream', { method: 'POST', body: JSON.stringify({ model, messages, ... }) })`
  - Pipe streaming response to `session/update` with `agent_message_chunk`
  - On completion, respond with `stopReason: "end_turn"`

### Step 4: Map prompt content to API

- ACP `prompt` is an array of content blocks (`text`, `resource` with `uri` and `text`)
- Extract user text and file contents
- Build `messages: [{ role: "user", content: "..." }]` (or include file content in the message)
- Use default model from env or first available: `AI_DEV_SUITE_MODEL=llama3.2:latest`

### Step 5: Ensure API is running

Options:

- **Manual** – Document that user must run `./start-ai-dev-suite-api.sh` first
- **Adapter spawn** – Adapter checks `http://localhost:41434` on startup; if down, spawn the Elixir API as subprocess (requires Elixir in PATH and knowing the project root)

---

## 9. Environment Variables

| Variable | Purpose |
|----------|---------|
| `AI_DEV_SUITE_API_URL` | API base URL. Default: `http://localhost:41434` |
| `AI_DEV_SUITE_MODEL` | Default Ollama model. Default: `llama3.2:latest` |
| `AI_DEV_SUITE_KB` | Default knowledge base. Default: `default` |

The adapter can pass these to the API on each request.

---

## 10. Tool Calls (optional, future)

ACP supports **tool calls** – the model can request the client to run tools (e.g. read file, run command). The AI Dev Suite has:

- `/api/research` – web research
- File operations via knowledge bases

A first version can omit tool calls and only handle text chat. Later, the adapter could map ACP tool requests to API calls (e.g. `research` tool → `POST /api/research`).

---

## 11. References

| Resource | URL |
|----------|-----|
| ACP spec | https://agentclientprotocol.com/ |
| ACP transports (stdio) | https://agentclientprotocol.com/protocol/transports |
| ACP prompt turn | https://agentclientprotocol.com/protocol/prompt-turn |
| TypeScript SDK | https://www.npmjs.com/package/@agentclientprotocol/sdk |
| Zed ACP | https://zed.dev/acp |
| OpenCode ACP | https://open-code.ai/en/docs/acp |
| Gemini CLI (reference) | https://github.com/google-gemini/gemini-cli |
| OpenCode (reference agent) | https://github.com/sst/opencode |

---

## 12. Checklist for implementation

- [ ] Create `ai-dev-suite/acp-adapter/` with package.json and TypeScript
- [ ] Implement stdio JSON-RPC transport
- [ ] Implement `initialize` handler
- [ ] Implement session setup handler
- [ ] Implement `session/prompt` handler → HTTP to `/api/chat/stream`
- [ ] Map streaming response to `session/update` (agent_message_chunk)
- [ ] Add `ai-dev-suite-acp` launcher script (e.g. in repo root) that runs `node acp-adapter/dist/index.js`
- [ ] Document Zed config in START.md and this doc
- [ ] Document OpenCode config (when available)
- [ ] Update doc/ai-dev-suite/README.md with ACP integration
- [ ] Add CHANGELOG entry when shipped

---

*WhyNot Productions · whynotproductions.netlify.app · doc/ai-dev-suite/*
