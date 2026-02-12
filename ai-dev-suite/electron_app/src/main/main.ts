import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
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

function startElixirAPI(): Promise<void> {
  return new Promise((resolve) => {
    const rootDir = path.resolve(__dirname, '../../../elixir_tui');
    if (!existsSync(path.join(rootDir, 'mix.exs'))) {
      console.warn('Elixir project not found at', rootDir, '- start API manually: mix run -e "AiDevSuiteTui.API.start()"');
      resolve();
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

    // Give API time to compile and start (first run can be slow)
    setTimeout(resolve, 4000);
  });
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
  await startElixirAPI();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (apiProcess) {
    apiProcess.kill();
    apiProcess = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('app:quit', () => {
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
