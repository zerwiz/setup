# AI Dev Suite ACP Adapter

Connects **Zed** and **OpenCode** to the AI Dev Suite via the [Agent Client Protocol (ACP)](https://agentclientprotocol.com). Enables chat with your local LLMs (Ollama) directly from the code editor.

## Prerequisites

- **AI Dev Suite API** running at `http://localhost:41434`  
  Start with: `./start-ai-dev-suite-api.sh` or via the Electron app
- **Ollama** with at least one model
- **Node.js 18+**

## Install & Build

```bash
cd ai-dev-suite/acp-adapter
npm install
npm run build
```

## Usage

Run the adapter (stdio; typically launched by Zed/OpenCode):

```bash
node dist/index.js
```

Or use the launcher from the tools root:

```bash
./start-ai-dev-suite-acp.sh
```

## Zed Configuration

Add to `~/.config/zed/settings.json`:

```json
{
  "agent_servers": {
    "AI Dev Suite": {
      "command": "node",
      "args": ["/absolute/path/to/ai-dev-suite/acp-adapter/dist/index.js"]
    }
  }
}
```

Then: Command Palette → `agent: new thread` → select "AI Dev Suite".

## OpenCode Configuration

Check OpenCode docs for ACP agent configuration. Same pattern: `command` + `args` to launch the adapter.

## Environment

| Variable | Purpose |
|----------|---------|
| `AI_DEV_SUITE_API_URL` | API base URL. Default: `http://localhost:41434` |
| `AI_DEV_SUITE_MODEL` | Default Ollama model. Default: `llama3.2:latest` |
| `AI_DEV_SUITE_KB` | Default knowledge base. Default: `default` |

## Architecture

```
Zed/OpenCode (ACP Client) ← stdio (JSON-RPC) → ACP Adapter ← HTTP → AI Dev Suite API (port 41434)
```

The adapter handles `initialize`, `newSession`, `prompt`; maps `session/prompt` to `POST /api/chat/stream`; and streams responses as `agent_message_chunk`.

---

*WhyNot Productions · [whynotproductions.netlify.app](https://whynotproductions.netlify.app)*
