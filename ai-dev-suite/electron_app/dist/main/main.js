"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const fs_1 = require("fs");
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
    return new Promise((resolve) => {
        const rootDir = path_1.default.resolve(__dirname, '../../../elixir_tui');
        if (!(0, fs_1.existsSync)(path_1.default.join(rootDir, 'mix.exs'))) {
            console.warn('Elixir project not found at', rootDir, '- start API manually: mix run -e "AiDevSuiteTui.API.start()"');
            resolve();
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
        // Give API time to compile and start (first run can be slow)
        setTimeout(resolve, 4000);
    });
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
    await startElixirAPI();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (apiProcess) {
        apiProcess.kill();
        apiProcess = null;
    }
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.ipcMain.handle('app:quit', () => {
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
electron_1.ipcMain.handle('settings:getConfigDir', () => loadSettings().configDir ?? '');
electron_1.ipcMain.handle('settings:setConfigDir', (_ev, dir) => {
    saveSettings({ configDir: dir?.trim() || undefined });
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
