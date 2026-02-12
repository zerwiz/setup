#!/usr/bin/env node
/**
 * AI Dev Suite ACP Adapter
 *
 * Connects Zed / OpenCode to the AI Dev Suite via Agent Client Protocol.
 * Requires: AI Dev Suite API running at http://localhost:41434
 *
 * Env: AI_DEV_SUITE_API_URL, AI_DEV_SUITE_MODEL, AI_DEV_SUITE_KB
 *
 * Usage: node dist/index.js  (or ai-dev-suite-acp)
 * Zed config: agent_servers.AI Dev Suite.command = "node", args = ["/path/to/acp-adapter/dist/index.js"]
 */

import * as acp from "@agentclientprotocol/sdk";
import { Readable, Writable } from "node:stream";
import { AiDevSuiteAgent } from "./agent.js";

const output = Writable.toWeb(process.stdout) as WritableStream<Uint8Array>;
const input = Readable.toWeb(process.stdin) as ReadableStream<Uint8Array>;

const stream = acp.ndJsonStream(output, input);
new acp.AgentSideConnection(
  (conn) => new AiDevSuiteAgent(conn),
  stream
);
