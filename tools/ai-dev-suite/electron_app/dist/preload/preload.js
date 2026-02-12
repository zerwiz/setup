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
        const res = await fetch(url, {
            ...opts,
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', ...opts?.headers },
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
electron_1.contextBridge.exposeInMainWorld('api', {
    base: API_BASE,
    fetch: apiFetch,
    get(path) {
        return apiFetch(path);
    },
    post(path, body, options) {
        return apiFetch(path, { method: 'POST', body: JSON.stringify(body), ...options });
    },
});
