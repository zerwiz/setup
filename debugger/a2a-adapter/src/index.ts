/**
 * AI Dev Suite – Debug A2A Adapter
 *
 * Exposes the debug observer as an Agent2Agent (A2A) compliant agent using
 * Google's open-source A2A Protocol. Other A2A agents can query it for
 * debug status and analysis.
 *
 * Skill: debug-analyzer – Returns API/Ollama status, recent logs, and optional
 * LLM analysis (via qwen2.5-coder) to help diagnose "(no response)" and similar issues.
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import {
  AgentCard,
  Message,
  AGENT_CARD_PATH,
} from "@a2a-js/sdk";
import {
  type AgentExecutor,
  RequestContext,
  type ExecutionEventBus,
  DefaultRequestHandler,
  InMemoryTaskStore,
} from "@a2a-js/sdk/server";
import {
  agentCardHandler,
  jsonRpcHandler,
  UserBuilder,
} from "@a2a-js/sdk/server/express";
import { readFileSync, existsSync } from "fs";

const PORT = parseInt(process.env.DEBUG_A2A_PORT || "41435", 10);
const BASE_URL = process.env.DEBUG_A2A_URL || `http://localhost:${PORT}`;

async function gatherDebugContext(): Promise<string> {
  const parts: string[] = [];
  const now = new Date().toISOString();

  // API status
  try {
    const r = await fetch("http://localhost:41434/api/ollama/models", {
      signal: AbortSignal.timeout(2000),
    });
    parts.push(`API (41434): ${r.status}`);
  } catch {
    parts.push("API (41434): down");
  }

  // Ollama status
  try {
    const r = await fetch("http://localhost:11434/api/tags", {
      signal: AbortSignal.timeout(2000),
    });
    parts.push(`Ollama (11434): ${r.status}`);
  } catch {
    parts.push("Ollama (11434): down");
  }

  // API log
  const apiLog = "/tmp/ai-dev-suite-api.log";
  if (existsSync(apiLog)) {
    const lines = readFileSync(apiLog, "utf-8").split("\n").slice(-20);
    parts.push("\nAPI log (last 20 lines):\n" + lines.join("\n"));
  } else {
    parts.push("\nAPI log: (not found)");
  }

  // Ollama log
  const ollaLog = "/tmp/ollama.log";
  if (existsSync(ollaLog)) {
    const lines = readFileSync(ollaLog, "utf-8").split("\n").slice(-20);
    parts.push("\nOllama log (last 20 lines):\n" + lines.join("\n"));
  } else {
    parts.push("\nOllama log: (not found)");
  }

  return `[${now}]\n${parts.join("\n")}`;
}

class DebugExecutor implements AgentExecutor {
  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus
  ): Promise<void> {
    const { userMessage, contextId } = requestContext;

    // Extract user text (if any)
    let userText = "";
    for (const part of userMessage.parts || []) {
      if (part.kind === "text" && "text" in part) {
        userText += (part as { text: string }).text;
      }
    }

    // Gather debug context
    const context = await gatherDebugContext();

    // If user asked for analysis and Ollama is available, optionally call qwen2.5-coder
    let analysis = "";
    if (
      userText.toLowerCase().includes("analyze") ||
      userText.toLowerCase().includes("suggest") ||
      userText === "" ||
      userText.length < 5
    ) {
      try {
        const model = process.env.DEBUG_MODEL || "qwen2.5-coder:3b";
        const body = JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content:
                "You are a debugging assistant for an AI chat app (Ollama + Elixir API + Electron). " +
                "Edit file (read/write): Choose file → Read → edit → Write. Allowed: project root, ~/.config/ai-dev-suite. Cannot write to /tmp. " +
                "Analyze this debug output and suggest what might be wrong and how to fix it. Be concise (2-4 short bullets).\n\n---\n\n" +
                context,
            },
          ],
        });
        const res = await fetch("http://localhost:11434/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: AbortSignal.timeout(60000),
        });
        if (res.ok) {
          const data = (await res.json()) as { message?: { content?: string } };
          analysis =
            "\n\n--- Debug assistant (qwen2.5-coder) ---\n" +
            (data.message?.content || "(no content)");
        }
      } catch {
        analysis = "\n\n(Ollama unreachable for analysis)";
      }
    }

    const reply =
      context + analysis ||
      "Debug context gathered. Send a message containing 'analyze' or 'suggest' to get LLM-backed debugging advice.";

    const responseMessage: Message = {
      kind: "message",
      messageId: uuidv4(),
      role: "agent",
      parts: [{ kind: "text", text: reply }],
      contextId,
    };

    eventBus.publish(responseMessage);
    eventBus.finished();
  }

  cancelTask = async (): Promise<void> => {};
}

// Agent card for discovery
const debugAgentCard: AgentCard = {
  name: "AI Dev Suite Debug Agent",
  description:
    "Observes and analyzes the AI Dev Suite (Ollama, Elixir API, Electron). Returns API/Ollama status, recent logs, and optional LLM analysis to help diagnose chat failures like '(no response)'.",
  protocolVersion: "0.3.0",
  version: "0.1.0",
  url: `${BASE_URL}/a2a/jsonrpc`,
  capabilities: {
    pushNotifications: false,
  },
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain"],
  skills: [
    {
      id: "debug-analyzer",
      name: "Debug analyzer",
      description:
        "Returns debug context (API/Ollama status, logs) and optionally LLM analysis. Send 'analyze' or 'suggest' for AI-backed debugging advice.",
      tags: ["debug", "diagnostics", "ai-dev-suite"],
      examples: [
        "What's the status?",
        "Analyze the debug output",
        "Why is chat returning (no response)?",
      ],
    },
  ],
  additionalInterfaces: [
    { url: `${BASE_URL}/a2a/jsonrpc`, transport: "JSONRPC" },
  ],
};

const agentExecutor = new DebugExecutor();
const requestHandler = new DefaultRequestHandler(
  debugAgentCard,
  new InMemoryTaskStore(),
  agentExecutor
);

const app = express();
app.use(express.json());

app.use(
  `/${AGENT_CARD_PATH}`,
  agentCardHandler({ agentCardProvider: requestHandler })
);
app.use(
  "/a2a/jsonrpc",
  jsonRpcHandler({
    requestHandler,
    userBuilder: UserBuilder.noAuthentication,
  })
);

// REST endpoint for Suite (or any client) to ask for debug analysis
// POST /api/analyze { message?: string, context?: string }
app.post("/api/analyze", async (req, res) => {
  try {
    const { message = "", context: extraContext = "" } = req.body || {};
    const debugContext = await gatherDebugContext();
    const combined = extraContext
      ? `${debugContext}\n\n--- Suite reported ---\n${extraContext}`
      : debugContext;

    const model = process.env.DEBUG_MODEL || "qwen2.5-coder:3b";
    const prompt =
      "You are a debugging assistant for an AI chat app (Ollama + Elixir API + Electron). " +
      "Edit file (read/write): Choose file → Read → edit → Write. Allowed: project root, ~/.config/ai-dev-suite. Cannot write to /tmp. " +
      "Analyze this debug output and suggest what might be wrong and how to fix it. " +
      "Be concise (2-4 short bullets). User-approved fixes only.\n\n---\n\n";

    const body = JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt + combined + (message ? `\n\nUser note: ${message}` : "") }],
    });

    const ollamaRes = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(60000),
    });

    let analysis = "";
    if (ollamaRes.ok) {
      const data = (await ollamaRes.json()) as { message?: { content?: string } };
      analysis = data.message?.content || "(no content)";
    } else {
      analysis = `(Ollama unreachable: ${ollamaRes.status})`;
    }

    res.json({
      ok: true,
      analysis,
      context: combined.slice(0, 500),
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: String(e),
      analysis: "(Debugger error)",
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI Dev Suite Debug A2A agent: http://localhost:${PORT}`);
  console.log(`Agent card: http://localhost:${PORT}/.well-known/agent-card.json`);
});
