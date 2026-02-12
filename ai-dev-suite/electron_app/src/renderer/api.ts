const API_BASE = 'http://localhost:41434';

async function browserFetch(path: string, opts?: { method?: string; body?: string; timeout?: number }) {
  const timeout = opts?.timeout ?? (path.includes('/api/chat') ? 300_000 : 30_000);
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...opts,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
    });
    clearTimeout(id);
    const data = await res.json();
    if (!res.ok) return { ...data, error: data.error || res.statusText };
    return data;
  } catch (e) {
    clearTimeout(id);
    return { error: e instanceof Error ? e.message : 'Failed to fetch' };
  }
}

async function uploadFile(path: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) return { ...data, error: data.error || res.statusText };
  return data;
}

// Use window.api (Electron preload) or browser fetch
const api = typeof window !== 'undefined' && window.api
  ? window.api
  : {
      get: (path: string) => browserFetch(path),
      post: (path: string, body: unknown, opts?: { timeout?: number }) =>
        browserFetch(path, { method: 'POST', body: JSON.stringify(body), ...opts }),
      put: (path: string, body: unknown, opts?: { timeout?: number }) =>
        browserFetch(path, { method: 'PUT', body: JSON.stringify(body), ...opts }),
      delete: (path: string) => browserFetch(path, { method: 'DELETE' }),
      uploadFile,
    };

export type Tool = { index: number; id: string; name: string; desc: string; url: string; cmd: string };
export type ToolList = { tools: Tool[] };
export type OllamaModels = { models?: string[]; error?: string };
export type ChatReply = { reply?: string; error?: string };
export type MemoryContent = { content: string };
export type DriveItems = { items: string[] };

export async function getTools(): Promise<ToolList> {
  return (await api.get('/api/tools')) as ToolList;
}

export async function installTool(index: number): Promise<{ ok?: boolean; error?: string }> {
  return (await api.post('/api/install', { index })) as { ok?: boolean; error?: string };
}

export async function getOllamaModels(): Promise<OllamaModels> {
  return (await api.get('/api/ollama/models')) as OllamaModels;
}

export async function pullModel(name: string): Promise<{ ok?: boolean; error?: string }> {
  return (await api.post('/api/ollama/pull', { model: name })) as { ok?: boolean; error?: string };
}

export async function startOllama(): Promise<{ ok?: boolean; error?: string }> {
  return (await api.post('/api/ollama/start', {})) as { ok?: boolean; error?: string };
}

export type AskDebuggerResult = { ok?: boolean; analysis?: string; error?: string };

export async function askDebugger(message?: string, context?: string): Promise<AskDebuggerResult> {
  return (await api.post('/api/debugger/ask', { message: message ?? '', context: context ?? '' }, { timeout: 70_000 })) as AskDebuggerResult;
}

export async function loadOllamaModel(model: string): Promise<{ ok?: boolean }> {
  if (!model?.trim()) return { ok: false };
  return (await api.post('/api/ollama/load', { model: model.trim() }, { timeout: 120_000 })) as { ok?: boolean };
}

export async function getDownloadableModels(): Promise<{ models: string[] }> {
  return (await api.get('/api/downloadable_models')) as { models: string[] };
}

export async function sendChat(
  model: string,
  messages: { role: string; content: string }[],
  knowledgeBases?: string | string[]
): Promise<ChatReply> {
  const body: Record<string, unknown> = { model, messages };
  if (Array.isArray(knowledgeBases) && knowledgeBases.length > 0) {
    body.knowledge_bases = knowledgeBases;
  } else if (typeof knowledgeBases === 'string' && knowledgeBases) {
    body.knowledge_base = knowledgeBases;
  }
  return (await api.post('/api/chat', body)) as ChatReply;
}

export type StreamCallbacks = {
  onDelta: (text: string) => void;
  onThinking?: (text: string) => void;
  onDone: () => void;
  onError: (err: string) => void;
};

export type ModelOptions = {
  temperature?: number;
  num_predict?: number;
  num_ctx?: number;
  top_p?: number;
  top_k?: number;
  repeat_penalty?: number;
  repeat_last_n?: number;
  seed?: number;
  stop?: string[];
};

export async function sendChatStream(
  model: string,
  messages: { role: string; content: string }[],
  knowledgeBases: string | string[] | undefined,
  callbacks: StreamCallbacks,
  options?: ModelOptions,
  internetEnabled?: boolean,
  abortSignal?: AbortSignal
): Promise<void> {
  const body: Record<string, unknown> = { model, messages };
  if (Array.isArray(knowledgeBases) && knowledgeBases.length > 0) {
    body.knowledge_bases = knowledgeBases;
  } else if (typeof knowledgeBases === 'string' && knowledgeBases) {
    body.knowledge_base = knowledgeBases;
  } else {
    body.knowledge_base = 'default';
  }
  if (options && Object.keys(options).length > 0) {
    body.options = options;
  }
  if (internetEnabled) {
    body.internet_enabled = true;
  }

  // Electron: use main-process proxy (no CORS, works when renderer fetch fails)
  if (typeof window !== 'undefined' && window.api?.chatStream) {
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => window.api?.chatStreamAbort?.());
    }
    return new Promise<void>((resolve) => {
      window.api!.chatStream!(body, {
        onChunk: (data: { delta?: string; thinking?: string; done?: boolean }) => {
          if (data.thinking && callbacks.onThinking) callbacks.onThinking(data.thinking);
          if (data.delta) callbacks.onDelta(data.delta);
          if (data.done) callbacks.onDone();
        },
        onDone: () => {
          callbacks.onDone();
          resolve();
        },
        onError: (err) => {
          callbacks.onError(err);
          resolve();
        },
      });
    });
  }

  // Browser: direct fetch
  const url = `${API_BASE}/api/chat/stream`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: abortSignal,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    callbacks.onError(
      msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')
        ? 'Cannot reach API. Start it: ./start-ai-dev-suite-api.sh'
        : msg
    );
    return;
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    callbacks.onError((data as { error?: string }).error || res.statusText);
    return;
  }
  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError('No response body');
    return;
  }
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (abortSignal?.aborted) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line) as { delta?: string; thinking?: string; done?: boolean; error?: string };
          if (data.thinking && callbacks.onThinking) callbacks.onThinking(data.thinking);
          if (data.delta) callbacks.onDelta(data.delta);
          if (data.done) callbacks.onDone();
          if (data.error) callbacks.onError(data.error);
        } catch (_) {}
      }
    }
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer) as { delta?: string; thinking?: string; done?: boolean; error?: string };
        if (data.thinking && callbacks.onThinking) callbacks.onThinking(data.thinking);
        if (data.delta) callbacks.onDelta(data.delta);
        if (data.done) callbacks.onDone();
        if (data.error) callbacks.onError(data.error);
      } catch (_) {}
    }
    callbacks.onDone();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (abortSignal?.aborted || msg === 'The operation was aborted.') {
      callbacks.onDone();
      return;
    }
    callbacks.onError(
      msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')
        ? 'Cannot reach API. Start it: ./start-ai-dev-suite-api.sh'
        : msg
    );
  }
}

export async function getKnowledgeBases(): Promise<{ knowledge_bases: string[] }> {
  return (await api.get('/api/knowledge-bases')) as { knowledge_bases: string[] };
}

export async function createKnowledgeBase(name: string): Promise<{ ok?: boolean; error?: string }> {
  return (await api.post('/api/knowledge-bases', { name })) as { ok?: boolean; error?: string };
}

export type DriveItem = { path: string; display: string };

export async function getKnowledgeBaseContents(name: string): Promise<{ items: DriveItem[] }> {
  return (await api.get(`/api/knowledge-bases/${encodeURIComponent(name)}/contents`)) as { items: DriveItem[] };
}

export async function deleteFromKnowledgeBase(
  name: string,
  relPath: string
): Promise<{ ok?: boolean; error?: string }> {
  return (await api.post(`/api/knowledge-bases/${encodeURIComponent(name)}/delete`, {
    path: relPath,
  })) as { ok?: boolean; error?: string };
}

export async function deleteBatchFromKnowledgeBase(
  name: string,
  paths: string[]
): Promise<{ ok?: boolean; error?: string }> {
  return (await api.post(`/api/knowledge-bases/${encodeURIComponent(name)}/delete-batch`, {
    paths,
  })) as { ok?: boolean; error?: string };
}

export async function deleteAllFromKnowledgeBase(
  name: string
): Promise<{ ok?: boolean; error?: string }> {
  return (await api.post(`/api/knowledge-bases/${encodeURIComponent(name)}/delete-all`, {})) as {
    ok?: boolean;
    error?: string;
  };
}

export async function deleteKnowledgeBase(
  name: string
): Promise<{ ok?: boolean; error?: string }> {
  return (await (api as { delete: (p: string) => Promise<unknown> }).delete(
    `/api/knowledge-bases/${encodeURIComponent(name)}`
  )) as { ok?: boolean; error?: string };
}

export async function addToKnowledgeBase(
  name: string,
  pathOrUrl: string
): Promise<{ ok?: boolean; error?: string }> {
  return (await api.post(`/api/knowledge-bases/${encodeURIComponent(name)}/add`, {
    path: pathOrUrl,
    url: pathOrUrl,
  })) as { ok?: boolean; error?: string };
}

export async function uploadToKnowledgeBase(
  name: string,
  file: File
): Promise<{ ok?: boolean; message?: string; error?: string }> {
  const path = `/api/knowledge-bases/${encodeURIComponent(name)}/upload`;
  const uploadFn = typeof window !== 'undefined' && window.api?.uploadFile
    ? window.api.uploadFile
    : uploadFile;
  return (await uploadFn(path, file)) as {
    ok?: boolean;
    message?: string;
    error?: string;
  };
}

export async function getMemory(): Promise<MemoryContent> {
  return (await api.get('/api/memory')) as MemoryContent;
}

export async function getMemoryManual(): Promise<MemoryContent> {
  return (await api.get('/api/memory/manual')) as MemoryContent;
}

export async function getMemoryConv(): Promise<MemoryContent> {
  return (await api.get('/api/memory/conv')) as MemoryContent;
}

export async function writeMemoryManual(content: string): Promise<{ ok?: boolean; error?: string }> {
  return (await (api as { put: (p: string, b: unknown) => Promise<unknown> }).put('/api/memory/manual', { content })) as { ok?: boolean; error?: string };
}

export async function writeMemoryConv(content: string): Promise<{ ok?: boolean; error?: string }> {
  return (await (api as { put: (p: string, b: unknown) => Promise<unknown> }).put('/api/memory/conv', { content })) as { ok?: boolean; error?: string };
}

export async function getBehavior(): Promise<MemoryContent> {
  return (await api.get('/api/behavior')) as MemoryContent;
}

export async function writeBehavior(content: string): Promise<{ ok?: boolean; error?: string }> {
  return (await (api as { put: (p: string, b: unknown) => Promise<unknown> }).put('/api/behavior', { content })) as { ok?: boolean; error?: string };
}

export async function remember(text: string, model: string): Promise<{ ok?: boolean }> {
  return (await api.post('/api/memory/remember', { text, model })) as { ok?: boolean };
}

export async function getMemoryModels(): Promise<{ models: string[] }> {
  return (await api.get('/api/memory/models')) as { models: string[] };
}

export async function getDrive(): Promise<DriveItems> {
  return (await api.get('/api/drive')) as DriveItems;
}

export async function addToDrive(path: string): Promise<{ ok?: boolean; error?: string }> {
  return (await api.post('/api/drive', { path })) as { ok?: boolean; error?: string };
}

export async function research(query: string): Promise<{ result?: string; error?: string }> {
  return (await api.post('/api/research', { query })) as { result?: string; error?: string };
}

export async function getConfig(): Promise<{ config_dir: string }> {
  return (await api.get('/api/config')) as { config_dir: string };
}

export type Preferences = { preferred_model?: string };
export async function getPreferences(): Promise<Preferences> {
  return (await api.get('/api/preferences')) as Preferences;
}
export async function savePreferences(prefs: Preferences): Promise<Preferences> {
  return (await ('put' in api && typeof api.put === 'function'
    ? api.put('/api/preferences', prefs)
    : browserFetch('/api/preferences', { method: 'PUT', body: JSON.stringify(prefs) }))) as Preferences;
}

export async function saveConversationFacts(
  model: string,
  messages: { role: string; content: string }[]
): Promise<{ ok?: boolean; error?: string }> {
  const opts = { timeout: 120_000 };
  return (await api.post('/api/bye', { model, messages }, opts)) as {
    ok?: boolean;
    error?: string;
  };
}

// llama.cpp server management
export type ServerConfig = {
  model_path?: string;
  port?: number;
  server_path?: string;
};

export type ServerStatus = {
  running: boolean;
  port?: number;
  model_path?: string;
  server_path?: string;
};

export async function getServerStatus(): Promise<ServerStatus & { error?: string }> {
  return (await api.get('/api/server/status')) as ServerStatus & { error?: string };
}

export async function getServerConfig(): Promise<ServerConfig & { error?: string }> {
  return (await api.get('/api/server/config')) as ServerConfig & { error?: string };
}

export async function putServerConfig(cfg: ServerConfig): Promise<ServerConfig & { error?: string }> {
  return (await (api as { put: (p: string, b: unknown) => Promise<unknown> }).put(
    '/api/server/config',
    cfg
  )) as ServerConfig & { error?: string };
}

export async function startServer(): Promise<{ ok?: boolean; port?: number; running?: boolean; error?: string }> {
  return (await api.post('/api/server/start', {})) as {
    ok?: boolean;
    port?: number;
    running?: boolean;
    error?: string;
  };
}

export async function stopServer(): Promise<{ ok?: boolean; error?: string }> {
  return (await api.post('/api/server/stop', {})) as { ok?: boolean; error?: string };
}
