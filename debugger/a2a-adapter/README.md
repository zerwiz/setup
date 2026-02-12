# AI Dev Suite Debug A2A Adapter

Exposes the debug observer via **Google's Agent2Agent (A2A) Protocol** – an open standard for agent-to-agent communication. Other A2A-compliant agents can query this adapter for status, logs, and AI-backed debugging advice.

## Quick start

```bash
./debugger/start-a2a.sh
```

Or with the full debug flow:

```bash
DEBUG=1 ./start-ai-dev-suite-electron.sh
```

The A2A agent runs at **http://localhost:41435** (override with `DEBUG_A2A_PORT`).

## Agent Card

Discovery endpoint:

```
http://localhost:41435/.well-known/agent-card.json
```

## Skills

| Skill          | Description |
|----------------|-------------|
| **debug-analyzer** | Returns API/Ollama status, recent logs, and optional LLM analysis. Send "analyze" or "suggest" for AI-backed debugging advice (uses qwen2.5-coder). |

## Example: Query from another A2A client

```javascript
import { ClientFactory } from '@a2a-js/sdk/client';
import { v4 as uuidv4 } from 'uuid';

const client = await new ClientFactory().createFromUrl('http://localhost:41435');

const result = await client.sendMessage({
  message: {
    messageId: uuidv4(),
    role: 'user',
    parts: [{ kind: 'text', text: 'Analyze the debug output' }],
    kind: 'message',
  },
});

console.log(result.parts[0].text);
```

## Environment

| Variable         | Default              | Description                    |
|------------------|----------------------|--------------------------------|
| `DEBUG_A2A_PORT` | 41435                | HTTP port for the A2A server   |
| `DEBUG_A2A_URL`  | http://localhost:PORT| Public URL (for Agent Card)    |
| `DEBUG_MODEL`    | qwen2.5-coder:3b     | Ollama model for analysis      |

## Links

- [A2A Protocol](https://google.github.io/A2A/)
- [A2A JS SDK](https://github.com/a2aproject/a2a-js)
