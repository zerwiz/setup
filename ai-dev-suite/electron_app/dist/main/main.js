"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const fs_1 = require("fs");
function expandConfigDir(dir) {
    const trimmed = dir?.trim() || '';
    if (trimmed.startsWith('~')) {
        return path_1.default.join(os_1.default.homedir(), trimmed.slice(1).replace(/^\//, ''));
    }
    return trimmed;
}
function ensureConfigDirAndFiles(dir) {
    const expanded = expandConfigDir(dir);
    if (!expanded)
        return;
    (0, fs_1.mkdirSync)(expanded, { recursive: true });
    const files = ['memory.md', 'conversation_memory.md', 'behavior.md'];
    for (const f of files) {
        const p = path_1.default.join(expanded, f);
        if (!(0, fs_1.existsSync)(p)) {
            (0, fs_1.writeFileSync)(p, '', 'utf-8');
        }
    }
}
// Avoid SUID sandbox error on Linux (chrome-sandbox permissions)
if (process.platform === 'linux') {
    electron_1.app.commandLine.appendSwitch('no-sandbox');
}
// Single instance: prevent profile lock when launching a second copy
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        const wins = electron_1.BrowserWindow.getAllWindows();
        if (wins.length > 0) {
            const w = wins[0];
            if (w.isMinimized())
                w.restore();
            w.focus();
        }
    });
}
const API_PORT = 41434;
const VITE_PORT = 5174;
let apiProcess = null;
function getSettingsPath() {
    return path_1.default.join(electron_1.app.getPath('userData'), 'settings.json');
}
function loadSettings() {
    try {
        const p = getSettingsPath();
        if ((0, fs_1.existsSync)(p)) {
            const data = JSON.parse((0, fs_1.readFileSync)(p, 'utf-8'));
            return { configDir: data.configDir || undefined };
        }
    }
    catch (_) { }
    return {};
}
function saveSettings(settings) {
    const p = getSettingsPath();
    (0, fs_1.mkdirSync)(path_1.default.dirname(p), { recursive: true });
    (0, fs_1.writeFileSync)(p, JSON.stringify(settings, null, 2), 'utf-8');
}
function startElixirAPI() {
    if (process.env.AI_DEV_SUITE_API_STARTED === '1') {
        return Promise.resolve(false);
    }
    return new Promise((resolve) => {
        const rootDir = electron_1.app.isPackaged
            ? path_1.default.join(process.resourcesPath, 'elixir_tui')
            : path_1.default.resolve(__dirname, '../../../elixir_tui');
        if (!(0, fs_1.existsSync)(path_1.default.join(rootDir, 'mix.exs'))) {
            console.warn('Elixir project not found at', rootDir, '- start API manually: mix run -e "AiDevSuiteTui.API.start()"');
            resolve(false);
            return;
        }
        const settings = loadSettings();
        const env = { ...process.env, MIX_ENV: 'dev' };
        if (settings.configDir?.trim()) {
            env.AI_DEV_SUITE_CONFIG_DIR = settings.configDir.trim();
        }
        const cmd = `cd "${rootDir}" && mix run -e "AiDevSuiteTui.API.start()"`;
        apiProcess = (0, child_process_1.spawn)(process.platform === 'win32' ? 'cmd' : '/bin/sh', [process.platform === 'win32' ? '/c' : '-c', cmd], {
            stdio: ['ignore', 'pipe', 'pipe'],
            env,
        });
        apiProcess.stdout?.on('data', (d) => process.stdout.write(d.toString()));
        apiProcess.stderr?.on('data', (d) => process.stderr.write(d.toString()));
        apiProcess.on('error', (err) => console.error('API process error:', err));
        // Give API time to spawn
        setTimeout(() => resolve(true), 2000);
    });
}
async function waitForAPIReady() {
    const url = `http://localhost:${API_PORT}/api/ollama/models`;
    const maxAttempts = 40; // 40 * 500ms = 20s
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const res = await fetch(url);
            if (res.ok || res.status === 500)
                return; // API is up (500 = Ollama not running, but API works)
        }
        catch {
            /* not ready yet */
        }
        await new Promise((r) => setTimeout(r, 500));
    }
}
function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1100,
        height: 750,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path_1.default.join(__dirname, '../preload/preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false, // allow fetch to localhost:41434 from file:// or cross-origin (fixes chat stream in Electron vs browser)
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#030406',
        show: false,
    });
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        win.loadURL(`http://localhost:${VITE_PORT}`);
    }
    else {
        win.loadFile(path_1.default.join(__dirname, '../renderer/index.html'));
    }
    win.once('ready-to-show', () => win.show());
}
electron_1.app.whenReady().then(async () => {
    const apiStarted = await startElixirAPI();
    if (apiStarted)
        await waitForAPIReady();
    createWindow();
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify().catch(() => { });
    }
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', async () => {
    try {
        await fetch(`http://localhost:${API_PORT}/api/ollama/stop`, { method: 'POST' });
    }
    catch {
        /* ignore */
    }
    if (apiProcess) {
        apiProcess.kill();
        apiProcess = null;
    }
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.ipcMain.handle('app:quit', async () => {
    // Stop Ollama if we started it (so all processes exit on Quit)
    try {
        await fetch(`http://localhost:${API_PORT}/api/ollama/stop`, { method: 'POST' });
    }
    catch {
        // API may already be down
    }
    if (apiProcess) {
        apiProcess.kill();
        apiProcess = null;
    }
    electron_1.app.quit();
});
electron_1.ipcMain.handle('dialog:selectFilesAndFolders', async () => {
    const win = electron_1.BrowserWindow.getFocusedWindow();
    if (!win)
        return { canceled: true, paths: [] };
    const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(win, {
        title: 'Select files or folders to add to knowledge base',
        properties: ['openFile', 'openDirectory', 'multiSelections'],
        buttonLabel: 'Add to KB',
    });
    return { canceled, paths: filePaths ?? [] };
});
electron_1.ipcMain.handle('dialog:selectDirectory', async () => {
    const win = electron_1.BrowserWindow.getFocusedWindow();
    if (!win)
        return { canceled: true, path: '' };
    const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(win, {
        title: 'Select config directory',
        properties: ['openDirectory'],
        buttonLabel: 'Select',
    });
    return { canceled, path: filePaths?.[0] ?? '' };
});
electron_1.ipcMain.handle('dialog:selectFile', async (_ev, opts) => {
    const win = electron_1.BrowserWindow.getFocusedWindow();
    if (!win)
        return { canceled: true, path: '' };
    const { canceled, filePaths } = await electron_1.dialog.showOpenDialog(win, {
        title: opts?.title ?? 'Select file',
        properties: ['openFile'],
        filters: opts?.filters,
        buttonLabel: 'Select',
    });
    return { canceled, path: filePaths?.[0] ?? '' };
});
let chatStreamAbortController = null;
electron_1.ipcMain.handle('chat:stream', async (event, body) => {
    chatStreamAbortController = new AbortController();
    const url = `http://localhost:${API_PORT}/api/chat/stream`;
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: chatStreamAbortController.signal,
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            event.sender.send('chat:stream:error', data.error || res.statusText);
            return;
        }
        const reader = res.body?.getReader();
        if (!reader) {
            event.sender.send('chat:stream:error', 'No response body');
            return;
        }
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                if (!line.trim())
                    continue;
                try {
                    const data = JSON.parse(line);
                    if (data.thinking)
                        event.sender.send('chat:stream:chunk', { thinking: data.thinking });
                    if (data.delta)
                        event.sender.send('chat:stream:chunk', { delta: data.delta });
                    if (data.done)
                        event.sender.send('chat:stream:chunk', { done: true });
                    if (data.error)
                        event.sender.send('chat:stream:error', data.error);
                }
                catch {
                    /* ignore parse errors */
                }
            }
        }
        if (buffer.trim()) {
            try {
                const data = JSON.parse(buffer);
                if (data.thinking)
                    event.sender.send('chat:stream:chunk', { thinking: data.thinking });
                if (data.delta)
                    event.sender.send('chat:stream:chunk', { delta: data.delta });
                if (data.done)
                    event.sender.send('chat:stream:chunk', { done: true });
                if (data.error)
                    event.sender.send('chat:stream:error', data.error);
            }
            catch {
                /* ignore */
            }
        }
        event.sender.send('chat:stream:done');
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg === 'The operation was aborted.') {
            event.sender.send('chat:stream:done');
        }
        else {
            event.sender.send('chat:stream:error', msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')
                ? 'Cannot reach API. Start it: ./start-ai-dev-suite-api.sh'
                : msg);
        }
    }
    finally {
        chatStreamAbortController = null;
    }
});
electron_1.ipcMain.on('chat:stream:abort', () => {
    chatStreamAbortController?.abort();
});
electron_1.ipcMain.handle('settings:getConfigDir', () => loadSettings().configDir ?? '');
electron_1.ipcMain.handle('settings:setConfigDir', (_ev, dir) => {
    const trimmed = dir?.trim() || undefined;
    if (trimmed) {
        ensureConfigDirAndFiles(trimmed);
    }
    saveSettings({ configDir: trimmed });
    return { ok: true };
});
electron_1.ipcMain.handle('settings:openConfigDirInFileManager', async (_ev, dir) => {
    const expanded = dir?.trim().startsWith('~')
        ? path_1.default.join(os_1.default.homedir(), dir.trim().slice(1).replace(/^\//, ''))
        : dir?.trim() || '';
    if (!expanded)
        return { ok: false, error: 'No config directory set' };
    try {
        (0, fs_1.mkdirSync)(expanded, { recursive: true });
        await electron_1.shell.openPath(expanded);
        return { ok: true };
    }
    catch (e) {
        return { ok: false, error: String(e) };
    }
});
