/**
 * ACP Agent implementation – connects to AI Dev Suite API.
 * Handles initialize, newSession, prompt; maps streaming response to sessionUpdate.
 */

import * as acp from "@agentclientprotocol/sdk";
import { Readable, Writable } from "node:stream";
import {
  streamChat,
  promptBlocksToMessages,
  getDefaultModel,
  checkApiHealth,
} from "./api.js";

interface AgentSession {
  pendingPrompt: AbortController | null;
}

export class AiDevSuiteAgent implements acp.Agent {
  private connection: acp.AgentSideConnection;
  private sessions = new Map<string, AgentSession>();

  constructor(connection: acp.AgentSideConnection) {
    this.connection = connection;
  }

  async initialize(
    _params: acp.InitializeRequest
  ): Promise<acp.InitializeResponse> {
    return {
      protocolVersion: acp.PROTOCOL_VERSION,
      agentCapabilities: {
        loadSession: false,
      },
    };
  }

  async newSession(
    _params: acp.NewSessionRequest
  ): Promise<acp.NewSessionResponse> {
    const sessionId = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    this.sessions.set(sessionId, { pendingPrompt: null });
    return { sessionId };
  }

  async authenticate(
    _params: acp.AuthenticateRequest
  ): Promise<acp.AuthenticateResponse> {
    return {};
  }

  async setSessionMode(
    _params: acp.SetSessionModeRequest
  ): Promise<acp.SetSessionModeResponse> {
    return {};
  }

  async prompt(params: acp.PromptRequest): Promise<acp.PromptResponse> {
    const session = this.sessions.get(params.sessionId);
    if (!session) {
      throw new Error(`Session ${params.sessionId} not found`);
    }

    session.pendingPrompt?.abort();
    session.pendingPrompt = new AbortController();
    const signal = session.pendingPrompt.signal;

    try {
      const ok = await checkApiHealth();
      if (!ok) {
        throw new Error(
          "AI Dev Suite API not running. Start with ./start-ai-dev-suite-api.sh"
        );
      }

      const content = params.prompt ?? [];
      const messages = promptBlocksToMessages(content);
      if (messages.length === 0) {
        return { stopReason: "end_turn" };
      }

      const model = getDefaultModel();
      const kb = process.env.AI_DEV_SUITE_KB || "default";
      const knowledgeBases = [kb];

      for await (const chunk of streamChat(
        model,
        messages,
        knowledgeBases,
        signal
      )) {
        if (signal.aborted) {
          session.pendingPrompt = null;
          return { stopReason: "cancelled" };
        }
        if (chunk.error) {
          session.pendingPrompt = null;
          throw new Error(chunk.error);
        }
        if (chunk.delta) {
          await this.connection.sessionUpdate({
            sessionId: params.sessionId,
            update: {
              sessionUpdate: "agent_message_chunk",
              content: { type: "text", text: chunk.delta },
            },
          });
        }
      }
    } catch (err) {
      if (session.pendingPrompt?.signal.aborted) {
        session.pendingPrompt = null;
        return { stopReason: "cancelled" };
      }
      session.pendingPrompt = null;
      throw err;
    }

    session.pendingPrompt = null;
    return { stopReason: "end_turn" };
  }

  async cancel(params: acp.CancelNotification): Promise<void> {
    this.sessions.get(params.sessionId)?.pendingPrompt?.abort();
  }
}
