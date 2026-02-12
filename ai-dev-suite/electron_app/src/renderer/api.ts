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

export async function getDownloadableModels(): Promise<{ models: string[] }> {
  return (await api.get('/api/downloadable_models')) as { models: string[] };
}

export async function sendChat(
  model: string,
  messages: { role: string; content: string }[],
  knowledgeBase?: string
): Promise<ChatReply> {
  return (await api.post('/api/chat', { model, messages, knowledge_base: knowledgeBase })) as ChatReply;
}

export async function getKnowledgeBases(): Promise<{ knowledge_bases: string[] }> {
  return (await api.get('/api/knowledge-bases')) as { knowledge_bases: string[] };
}

export async function createKnowledgeBase(name: string): Promise<{ ok?: boolean; error?: string }> {
  return (await api.post('/api/knowledge-bases', { name })) as { ok?: boolean; error?: string };
}

export async function getKnowledgeBaseContents(name: string): Promise<{ items: string[] }> {
  return (await api.get(`/api/knowledge-bases/${encodeURIComponent(name)}/contents`)) as { items: string[] };
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
