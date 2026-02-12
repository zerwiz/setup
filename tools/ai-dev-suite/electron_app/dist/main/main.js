"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const fs_1 = require("fs");
// Avoid SUID sandbox error on Linux (chrome-sandbox permissions)
if (process.platform === 'linux') {
    electron_1.app.commandLine.appendSwitch('no-sandbox');
}
const API_PORT = 41434;
const VITE_PORT = 5174;
let apiProcess = null;
function startElixirAPI() {
    return new Promise((resolve) => {
        const rootDir = path_1.default.resolve(__dirname, '../../../elixir_tui');
        if (!(0, fs_1.existsSync)(path_1.default.join(rootDir, 'mix.exs'))) {
            console.warn('Elixir project not found at', rootDir, '- start API manually: mix run -e "AiDevSuiteTui.API.start()"');
            resolve();
            return;
        }
        // Use shell so mix is found in user's PATH
        const cmd = `cd "${rootDir}" && mix run -e "AiDevSuiteTui.API.start()"`;
        apiProcess = (0, child_process_1.spawn)(process.platform === 'win32' ? 'cmd' : '/bin/sh', [process.platform === 'win32' ? '/c' : '-c', cmd], {
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
        win.webContents.openDevTools();
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
