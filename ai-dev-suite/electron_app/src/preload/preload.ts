import { contextBridge, ipcRenderer } from 'electron';

const API_BASE = 'http://localhost:41434';

const apiFetch = async (path: string, options?: RequestInit & { timeout?: number }) => {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const timeout = options?.timeout ?? (path.includes('/api/chat') ? 300_000 : 30_000);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const { timeout: _, ...opts } = options ?? {};
    const isFormData = opts.body instanceof FormData;
    const headers = isFormData ? (opts.headers as Record<string, string> ?? {}) : { 'Content-Type': 'application/json', ...(opts?.headers as Record<string, string>) };
    const res = await fetch(url, {
      ...opts,
      signal: controller.signal,
      headers,
    });
    clearTimeout(id);
    let data;
    try {
      data = await res.json();
    } catch (_) {
      return { error: `Server error ${res.status}: not JSON` };
    }
    if (!res.ok) return { ...data, error: data.error || res.statusText };
    return data;
  } catch (e) {
    clearTimeout(id);
    const msg = e instanceof Error ? e.message : 'Failed to fetch';
    if (msg === 'The operation was aborted.') {
      return { error: 'Request timed out (chat can take 1–2 min)' };
    }
    if (msg.includes('fetch')) {
      return { error: 'Cannot reach API. Start it: ./start-ai-dev-suite-api.sh' };
    }
    return { error: msg };
  }
};

type ChatStreamCallbacks = {
  onChunk: (data: { delta?: string; thinking?: string; done?: boolean }) => void;
  onDone: () => void;
  onError: (err: string) => void;
};

const chatStream = (body: Record<string, unknown>, callbacks: ChatStreamCallbacks) => {
  const chunkHandler = (_ev: unknown, data: { delta?: string; thinking?: string; done?: boolean }) => callbacks.onChunk(data);
  const doneHandler = () => {
    ipcRenderer.removeListener('chat:stream:chunk', chunkHandler);
    ipcRenderer.removeAllListeners('chat:stream:done');
    ipcRenderer.removeAllListeners('chat:stream:error');
    callbacks.onDone();
  };
  const errorHandler = (_ev: unknown, err: string) => {
    ipcRenderer.removeListener('chat:stream:chunk', chunkHandler);
    ipcRenderer.removeAllListeners('chat:stream:done');
    ipcRenderer.removeAllListeners('chat:stream:error');
    callbacks.onError(err);
  };
  ipcRenderer.on('chat:stream:chunk', chunkHandler);
  ipcRenderer.once('chat:stream:done', doneHandler);
  ipcRenderer.once('chat:stream:error', errorHandler);
  ipcRenderer.invoke('chat:stream', body).finally(() => {
    ipcRenderer.removeListener('chat:stream:chunk', chunkHandler);
  });
};

contextBridge.exposeInMainWorld('api', {
  base: API_BASE,
  fetch: apiFetch,
  chatStream,
  chatStreamAbort: () => ipcRenderer.send('chat:stream:abort'),
  quitApp: () => ipcRenderer.invoke('app:quit'),
  selectFilesAndFolders: () => ipcRenderer.invoke('dialog:selectFilesAndFolders'),
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
  selectFile: (opts?: { title?: string; filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke('dialog:selectFile', opts),
  openConfigDirInFileManager: (dir: string) => ipcRenderer.invoke('settings:openConfigDirInFileManager', dir),
  getConfigDirSetting: () => ipcRenderer.invoke('settings:getConfigDir'),
  setConfigDirSetting: (dir: string) => ipcRenderer.invoke('settings:setConfigDir', dir),
  get(path: string) {
    return apiFetch(path);
  },
  post(path: string, body: unknown, options?: { timeout?: number }) {
    return apiFetch(path, { method: 'POST', body: JSON.stringify(body), ...options });
  },
  put(path: string, body: unknown, options?: { timeout?: number }) {
    return apiFetch(path, { method: 'PUT', body: JSON.stringify(body), ...options });
  },
  delete(path: string) {
    return apiFetch(path, { method: 'DELETE' });
  },
  uploadFile(path: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch(path, { method: 'POST', body: formData });
  },
});
