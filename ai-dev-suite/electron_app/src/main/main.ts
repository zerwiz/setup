import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import os from 'os';
import { spawn, ChildProcess } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

function expandConfigDir(dir: string): string {
  const trimmed = dir?.trim() || '';
  if (trimmed.startsWith('~')) {
    return path.join(os.homedir(), trimmed.slice(1).replace(/^\//, ''));
  }
  return trimmed;
}

function ensureConfigDirAndFiles(dir: string): void {
  const expanded = expandConfigDir(dir);
  if (!expanded) return;
  mkdirSync(expanded, { recursive: true });
  const files = ['memory.md', 'conversation_memory.md', 'behavior.md'];
  for (const f of files) {
    const p = path.join(expanded, f);
    if (!existsSync(p)) {
      writeFileSync(p, '', 'utf-8');
    }
  }
}

// Avoid SUID sandbox error on Linux (chrome-sandbox permissions)
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
}

// Single instance: prevent profile lock when launching a second copy
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
      const w = wins[0];
      if (w.isMinimized()) w.restore();
      w.focus();
    }
  });
}

const API_PORT = 41434;
const VITE_PORT = 5174;

let apiProcess: ChildProcess | null = null;

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings(): { configDir?: string } {
  try {
    const p = getSettingsPath();
    if (existsSync(p)) {
      const data = JSON.parse(readFileSync(p, 'utf-8'));
      return { configDir: data.configDir || undefined };
    }
  } catch (_) {}
  return {};
}

function saveSettings(settings: { configDir?: string }): void {
  const p = getSettingsPath();
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(settings, null, 2), 'utf-8');
}

function startElixirAPI(): Promise<boolean> {
  if (process.env.AI_DEV_SUITE_API_STARTED === '1') {
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const rootDir = app.isPackaged
      ? path.join(process.resourcesPath, 'elixir_tui')
      : path.resolve(__dirname, '../../../elixir_tui');
    if (!existsSync(path.join(rootDir, 'mix.exs'))) {
      console.warn('Elixir project not found at', rootDir, '- start API manually: mix run -e "AiDevSuiteTui.API.start()"');
      resolve(false);
      return;
    }

    const settings = loadSettings();
    const env: NodeJS.ProcessEnv = { ...process.env, MIX_ENV: 'dev' };
    if (settings.configDir?.trim()) {
      env.AI_DEV_SUITE_CONFIG_DIR = settings.configDir.trim();
    }

    const cmd = `cd "${rootDir}" && mix run -e "AiDevSuiteTui.API.start()"`;
    apiProcess = spawn(process.platform === 'win32' ? 'cmd' : '/bin/sh', [process.platform === 'win32' ? '/c' : '-c', cmd], {
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

async function waitForAPIReady(): Promise<void> {
  const url = `http://localhost:${API_PORT}/api/ollama/models`;
  const maxAttempts = 40; // 40 * 500ms = 20s
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 500) return; // API is up (500 = Ollama not running, but API works)
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
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
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  win.once('ready-to-show', () => win.show());
}

app.whenReady().then(async () => {
  const apiStarted = await startElixirAPI();
  if (apiStarted) await waitForAPIReady();
  createWindow();

  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  try {
    await fetch(`http://localhost:${API_PORT}/api/ollama/stop`, { method: 'POST' });
  } catch {
    /* ignore */
  }
  if (apiProcess) {
    apiProcess.kill();
    apiProcess = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('app:quit', async () => {
  // Stop Ollama if we started it (so all processes exit on Quit)
  try {
    await fetch(`http://localhost:${API_PORT}/api/ollama/stop`, { method: 'POST' });
  } catch {
    // API may already be down
  }
  if (apiProcess) {
    apiProcess.kill();
    apiProcess = null;
  }
  app.quit();
});

ipcMain.handle('dialog:selectFilesAndFolders', async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return { canceled: true, paths: [] };
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Select files or folders to add to knowledge base',
    properties: ['openFile', 'openDirectory', 'multiSelections'],
    buttonLabel: 'Add to KB',
  });
  return { canceled, paths: filePaths ?? [] };
});

ipcMain.handle('dialog:selectDirectory', async () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return { canceled: true, path: '' };
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Select config directory',
    properties: ['openDirectory'],
    buttonLabel: 'Select',
  });
  return { canceled, path: filePaths?.[0] ?? '' };
});

ipcMain.handle(
  'dialog:selectFile',
  async (_ev: unknown, opts?: { title?: string; filters?: { name: string; extensions: string[] }[] }) => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { canceled: true, path: '' };
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: opts?.title ?? 'Select file',
      properties: ['openFile'],
      filters: opts?.filters,
      buttonLabel: 'Select',
    });
    return { canceled, path: filePaths?.[0] ?? '' };
  }
);

let chatStreamAbortController: AbortController | null = null;

ipcMain.handle(
  'chat:stream',
  async (event, body: Record<string, unknown>) => {
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
        event.sender.send('chat:stream:error', (data as { error?: string }).error || res.statusText);
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
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line) as { delta?: string; thinking?: string; done?: boolean; error?: string };
            if (data.thinking) event.sender.send('chat:stream:chunk', { thinking: data.thinking });
            if (data.delta) event.sender.send('chat:stream:chunk', { delta: data.delta });
            if (data.done) event.sender.send('chat:stream:chunk', { done: true });
            if (data.error) event.sender.send('chat:stream:error', data.error);
          } catch {
            /* ignore parse errors */
          }
        }
      }
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer) as { delta?: string; thinking?: string; done?: boolean; error?: string };
          if (data.thinking) event.sender.send('chat:stream:chunk', { thinking: data.thinking });
          if (data.delta) event.sender.send('chat:stream:chunk', { delta: data.delta });
          if (data.done) event.sender.send('chat:stream:chunk', { done: true });
          if (data.error) event.sender.send('chat:stream:error', data.error);
        } catch {
          /* ignore */
        }
      }
      event.sender.send('chat:stream:done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg === 'The operation was aborted.') {
        event.sender.send('chat:stream:done');
      } else {
        event.sender.send(
          'chat:stream:error',
          msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')
            ? 'Cannot reach API. Start it: ./start-ai-dev-suite-api.sh'
            : msg
        );
      }
    } finally {
      chatStreamAbortController = null;
    }
  }
);

ipcMain.on('chat:stream:abort', () => {
  chatStreamAbortController?.abort();
});

ipcMain.handle('settings:getConfigDir', () => loadSettings().configDir ?? '');

ipcMain.handle('settings:setConfigDir', (_ev, dir: string) => {
  const trimmed = dir?.trim() || undefined;
  if (trimmed) {
    ensureConfigDirAndFiles(trimmed);
  }
  saveSettings({ configDir: trimmed });
  return { ok: true };
});

ipcMain.handle('settings:openConfigDirInFileManager', async (_ev, dir: string) => {
  const expanded = dir?.trim().startsWith('~')
    ? path.join(os.homedir(), dir.trim().slice(1).replace(/^\//, ''))
    : dir?.trim() || '';
  if (!expanded) return { ok: false, error: 'No config directory set' };
  try {
    mkdirSync(expanded, { recursive: true });
    await shell.openPath(expanded);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});
