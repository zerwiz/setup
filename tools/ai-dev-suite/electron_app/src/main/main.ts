import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';

// Avoid SUID sandbox error on Linux (chrome-sandbox permissions)
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
}

const API_PORT = 41434;
const VITE_PORT = 5174;

let apiProcess: ChildProcess | null = null;

function startElixirAPI(): Promise<void> {
  return new Promise((resolve) => {
    const rootDir = path.resolve(__dirname, '../../../elixir_tui');
    if (!existsSync(path.join(rootDir, 'mix.exs'))) {
      console.warn('Elixir project not found at', rootDir, '- start API manually: mix run -e "AiDevSuiteTui.API.start()"');
      resolve();
      return;
    }

    // Use shell so mix is found in user's PATH
    const cmd = `cd "${rootDir}" && mix run -e "AiDevSuiteTui.API.start()"`;
    apiProcess = spawn(process.platform === 'win32' ? 'cmd' : '/bin/sh', [process.platform === 'win32' ? '/c' : '-c', cmd], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, MIX_ENV: 'dev' },
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
    win.webContents.openDevTools();
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
