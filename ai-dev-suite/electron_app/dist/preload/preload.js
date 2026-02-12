"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const API_BASE = 'http://localhost:41434';
const apiFetch = async (path, options) => {
    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
    const timeout = options?.timeout ?? (path.includes('/api/chat') ? 300000 : 30000);
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const { timeout: _, ...opts } = options ?? {};
        const isFormData = opts.body instanceof FormData;
        const headers = isFormData ? (opts.headers ?? {}) : { 'Content-Type': 'application/json', ...opts?.headers };
        const res = await fetch(url, {
            ...opts,
            signal: controller.signal,
            headers,
        });
        clearTimeout(id);
        let data;
        try {
            data = await res.json();
        }
        catch (_) {
            return { error: `Server error ${res.status}: not JSON` };
        }
        if (!res.ok)
            return { ...data, error: data.error || res.statusText };
        return data;
    }
    catch (e) {
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
const chatStream = (body, callbacks) => {
    const chunkHandler = (_ev, data) => callbacks.onChunk(data);
    const doneHandler = () => {
        electron_1.ipcRenderer.removeListener('chat:stream:chunk', chunkHandler);
        electron_1.ipcRenderer.removeAllListeners('chat:stream:done');
        electron_1.ipcRenderer.removeAllListeners('chat:stream:error');
        callbacks.onDone();
    };
    const errorHandler = (_ev, err) => {
        electron_1.ipcRenderer.removeListener('chat:stream:chunk', chunkHandler);
        electron_1.ipcRenderer.removeAllListeners('chat:stream:done');
        electron_1.ipcRenderer.removeAllListeners('chat:stream:error');
        callbacks.onError(err);
    };
    electron_1.ipcRenderer.on('chat:stream:chunk', chunkHandler);
    electron_1.ipcRenderer.once('chat:stream:done', doneHandler);
    electron_1.ipcRenderer.once('chat:stream:error', errorHandler);
    electron_1.ipcRenderer.invoke('chat:stream', body).finally(() => {
        electron_1.ipcRenderer.removeListener('chat:stream:chunk', chunkHandler);
    });
};
electron_1.contextBridge.exposeInMainWorld('api', {
    base: API_BASE,
    fetch: apiFetch,
    chatStream,
    chatStreamAbort: () => electron_1.ipcRenderer.send('chat:stream:abort'),
    quitApp: () => electron_1.ipcRenderer.invoke('app:quit'),
    selectFilesAndFolders: () => electron_1.ipcRenderer.invoke('dialog:selectFilesAndFolders'),
    selectDirectory: () => electron_1.ipcRenderer.invoke('dialog:selectDirectory'),
    selectFile: (opts) => electron_1.ipcRenderer.invoke('dialog:selectFile', opts),
    openConfigDirInFileManager: (dir) => electron_1.ipcRenderer.invoke('settings:openConfigDirInFileManager', dir),
    getConfigDirSetting: () => electron_1.ipcRenderer.invoke('settings:getConfigDir'),
    setConfigDirSetting: (dir) => electron_1.ipcRenderer.invoke('settings:setConfigDir', dir),
    get(path) {
        return apiFetch(path);
    },
    post(path, body, options) {
        return apiFetch(path, { method: 'POST', body: JSON.stringify(body), ...options });
    },
    put(path, body, options) {
        return apiFetch(path, { method: 'PUT', body: JSON.stringify(body), ...options });
    },
    delete(path) {
        return apiFetch(path, { method: 'DELETE' });
    },
    uploadFile(path, file) {
        const formData = new FormData();
        formData.append('file', file);
        return apiFetch(path, { method: 'POST', body: formData });
    },
});
