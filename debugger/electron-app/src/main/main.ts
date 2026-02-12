import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import os from 'os';
import { execSync, execFileSync, spawn } from 'child_process';
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, statSync, createWriteStream } from 'fs';

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
}

const VITE_PORT = 5175;

function getDebuggerMemoryPath(): string {
  const configDir = path.join(os.homedir(), '.config', 'ai-dev-suite');
  return path.join(configDir, 'debugger_memory.md');
}

function getProjectRoot(): string {
  let dir = process.env.AI_DEV_SUITE_REPO || process.env.DEBUGGER_REPO || '';
  if (!dir) {
    let d = path.resolve(__dirname, '..', '..', '..');
    for (let i = 0; i < 5; i++) {
      if (existsSync(d)) {
        const names = readdirSync(d);
        if (names.includes('ai-dev-suite') && names.includes('debugger')) {
          dir = d;
          break;
        }
      }
      d = path.join(d, '..');
    }
  }
  return dir || process.cwd();
}

// IPC: read debugger memory (past fixes for RAG-style recall)
ipcMain.handle('debug:getMemory', () => {
  const p = getDebuggerMemoryPath();
  if (!existsSync(p)) return { content: '', error: null };
  try {
    const content = readFileSync(p, 'utf-8');
    return { content, error: null };
  } catch (e) {
    return { content: '', error: String(e) };
  }
});

// IPC: append a fix to debugger memory
ipcMain.handle('debug:saveFix', (_ev, payload: { issueSummary: string; fix: string }) => {
  const p = getDebuggerMemoryPath();
  const dir = path.dirname(p);
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const block = `\n## ${date}\n**Issue:** ${(payload.issueSummary || '').slice(0, 300)}\n**Fix:**\n${(payload.fix || '').trim()}\n`;
    appendFileSync(p, block, 'utf-8');
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

// IPC: list processes (relevant + terminals)
ipcMain.handle('debug:getProcesses', () => {
  try {
    const psOut = execSync('ps aux', { encoding: 'utf-8', timeout: 5000 });
    const lines = psOut.trim().split('\n');
    const header = lines[0] ?? '';
    const rows = lines.slice(1);
    const relevant = ['ollama', 'node', 'beam', 'elixir', 'vite', 'electron', 'mix', 'erl'];
    const allProcs = rows.map((r) => r.trim()).filter(Boolean);
    const terminalProcs = allProcs.filter((r) => /pts\/|tty[0-9]|gnome-terminal|xterm|konsole|xfce4-terminal|kitty|alacritty/i.test(r));
    const relevantProcs = allProcs.filter((r) => relevant.some((k) => r.toLowerCase().includes(k)));
    return { header, all: allProcs.slice(0, 80), terminals: terminalProcs.slice(0, 20), relevant: relevantProcs.slice(0, 50), error: null };
  } catch (e) {
    return { header: '', all: [], terminals: [], relevant: [], error: String(e) };
  }
});

// IPC: list relevant files (config, logs, project)
ipcMain.handle('debug:getFiles', () => {
  const configDir = path.join(os.homedir(), '.config', 'ai-dev-suite');
  const configFiles: string[] = [];
  const logFiles: { path: string; size: number; mtime: string }[] = [];
  const projectFiles: string[] = [];
  const projectRoot = getProjectRoot();
  try {
    if (existsSync(configDir)) {
      for (const name of readdirSync(configDir)) {
        const fp = path.join(configDir, name);
        const st = statSync(fp);
        if (st.isFile()) configFiles.push(`${name} (${st.size}B)`);
      }
    }
  } catch {
    /* ignore */
  }
  const tmpLogs = ['ai-dev-suite-api.log', 'ollama.log', 'ai-dev-suite-debug-a2a.log', 'ai-dev-suite-electron.log'];
  for (const name of tmpLogs) {
    const fp = path.join('/tmp', name);
    if (existsSync(fp)) {
      const st = statSync(fp);
      logFiles.push({ path: fp, size: st.size, mtime: st.mtime.toISOString().slice(0, 19) });
    }
  }
  const ragLog = path.join(configDir, 'rag.log');
  if (existsSync(ragLog)) {
    const st = statSync(ragLog);
    logFiles.push({ path: ragLog, size: st.size, mtime: st.mtime.toISOString().slice(0, 19) });
  }
  try {
    const root = path.resolve(projectRoot);
    if (existsSync(root)) {
      for (const name of readdirSync(root)) {
        if (name.startsWith('.')) continue;
        const fp = path.join(root, name);
        const st = statSync(fp);
        if (st.isFile()) projectFiles.push(`${name} (${st.size}B)`);
        else if (st.isDirectory() && ['ai-dev-suite', 'debugger', 'rag', 'doc'].includes(name)) projectFiles.push(`${name}/`);
      }
    }
  } catch {
    /* ignore */
  }
  return { configDir, configFiles, logFiles, projectRoot, projectFiles, error: null };
});

// IPC: start a script (API, Ollama) – spawns in background, logs to /tmp
ipcMain.handle('debug:startScript', async (_ev, scriptId: 'api' | 'ollama') => {
  const root = getProjectRoot();
  if (!root || !existsSync(root)) return { ok: false, output: '', error: 'Project root not found' };
  const logPath = scriptId === 'api' ? '/tmp/ai-dev-suite-api.log' : '/tmp/ollama.log';
  try {
    if (scriptId === 'ollama') {
      const proc = spawn('ollama', ['serve'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
      });
      const out = createWriteStream(logPath, { flags: 'a' });
      proc.stdout?.pipe(out);
      proc.stderr?.pipe(out);
      proc.unref();
      return { ok: true, output: `Ollama started (log: ${logPath})`, error: null };
    }
    if (scriptId === 'api') {
      const apiScript = path.join(root, 'start-ai-dev-suite-api.sh');
      const elixirDir = path.join(root, 'ai-dev-suite', 'elixir_tui');
      if (!existsSync(apiScript) && !existsSync(path.join(elixirDir, 'mix.exs'))) {
        return { ok: false, output: '', error: 'API script or elixir_tui not found' };
      }
      const proc = existsSync(apiScript)
        ? spawn('bash', [apiScript], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
        : spawn('mix', ['run', '-e', 'AiDevSuiteTui.API.start()'], { cwd: elixirDir, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
      const out = createWriteStream(logPath, { flags: 'a' });
      proc.stdout?.pipe(out);
      proc.stderr?.pipe(out);
      proc.unref();
      return { ok: true, output: `API started (log: ${logPath})`, error: null };
    }
  } catch (e) {
    return { ok: false, output: '', error: String(e) };
  }
  return { ok: false, output: '', error: 'Unknown script' };
});

// Allowed bases for file read/write (security: no escape outside project or config)
function isPathAllowed(targetPath: string, forWrite: boolean): { ok: boolean; error?: string } {
  const root = getProjectRoot();
  const configDir = path.join(os.homedir(), '.config', 'ai-dev-suite');
  const allowed = [root, configDir, '/tmp'].filter(Boolean);
  let resolved: string;
  try {
    resolved = path.resolve(targetPath);
  } catch {
    return { ok: false, error: 'Invalid path' };
  }
  for (const base of allowed) {
    if (!base) continue;
    const baseResolved = path.resolve(base);
    if (resolved === baseResolved || resolved.startsWith(baseResolved + path.sep)) {
      if (forWrite && baseResolved === '/tmp') return { ok: false, error: 'Cannot write to /tmp' };
      return { ok: true };
    }
  }
  return { ok: false, error: `Path must be under project root or ~/.config/ai-dev-suite` };
}

// IPC: read file (project root or config dir)
ipcMain.handle('debug:readFile', (_ev, filePath: string) => {
  const check = isPathAllowed(filePath, false);
  if (!check.ok) return { content: '', error: check.error };
  try {
    const content = readFileSync(filePath, 'utf-8');
    return { content, error: null };
  } catch (e) {
    return { content: '', error: String(e) };
  }
});

// IPC: write file (project root or config dir; user must approve)
ipcMain.handle('debug:writeFile', (_ev, filePath: string, content: string) => {
  const check = isPathAllowed(filePath, true);
  if (!check.ok) return { ok: false, error: check.error };
  try {
    const dir = path.dirname(filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, content, 'utf-8');
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
});

// IPC: open file picker for Run fix – user selects script/file to run
ipcMain.handle('debug:selectFile', async () => {
  const win = BrowserWindow.getFocusedWindow();
  const opts: Electron.OpenDialogOptions = {
    title: 'Select file to run',
    defaultPath: getProjectRoot() || os.homedir(),
    properties: ['openFile'],
    filters: [
      { name: 'Scripts', extensions: ['sh', 'bash'] },
      { name: 'All', extensions: ['*'] },
    ],
  };
  const result = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
  if (result.canceled || !result.filePaths.length) return { path: null, error: null };
  return { path: result.filePaths[0], error: null };
});

// IPC: open file picker for read/write – any file under project
ipcMain.handle('debug:selectFileForEdit', async () => {
  const win = BrowserWindow.getFocusedWindow();
  const opts: Electron.OpenDialogOptions = {
    title: 'Select file to read/edit',
    defaultPath: getProjectRoot() || os.homedir(),
    properties: ['openFile'],
  };
  const result = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
  if (result.canceled || !result.filePaths.length) return { path: null, error: null };
  return { path: result.filePaths[0], error: null };
});

// IPC: free port 11434 (kill process using it) – for Ollama "address already in use"
ipcMain.handle('debug:freePort', async (_ev, port: number) => {
  const p = port || 11434;
  const cmds = [
    `fuser -k ${p}/tcp 2>/dev/null || true`,
    `lsof -t -i:${p} 2>/dev/null | xargs kill -9 2>/dev/null || true`,
  ];
  for (const cmd of cmds) {
    try {
      execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', timeout: 5000, shell: '/bin/sh' });
      return { ok: true, output: `Port ${p} freed`, error: null };
    } catch {
      /* try next */
    }
  }
  return { ok: false, output: '', error: `Could not free port ${p}. Try: fuser -k ${p}/tcp` };
});

// IPC: run a fix command (user-approved) – e.g. ollama pull, bash script, etc.
ipcMain.handle('debug:runCommand', async (_ev, cmd: string) => {
  const trimmed = (cmd || '').trim();
  if (!trimmed) return { ok: false, output: '', error: 'Empty command' };
  const allowed = ['ollama', 'mix', 'npm', 'bash', 'sh', 'fuser', 'lsof', 'kill'];
  const first = trimmed.split(/\s+/)[0]?.toLowerCase() ?? '';
  if (!allowed.some((a) => first === a || first.endsWith('/' + a))) {
    return { ok: false, output: '', error: `Command not allowed. Use: ${allowed.join(', ')}` };
  }
  try {
    const result = execSync(trimmed, { encoding: 'utf-8', timeout: 120_000, cwd: getProjectRoot() });
    return { ok: true, output: result || '(ok)', error: null };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    const out = [err.stdout, err.stderr, err.message].filter(Boolean).join('\n') || String(e);
    return { ok: false, output: out, error: String(e) };
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 700,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
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

// Session-based logs: start empty, only show lines added during this session
const sessionLogLastRead: Record<string, number> = {};
const LOG_PATHS: Record<string, string> = {
  api: '/tmp/ai-dev-suite-api.log',
  ollama: '/tmp/ollama.log',
  a2a: '/tmp/ai-dev-suite-debug-a2a.log',
  rag: path.join(os.homedir(), '.config', 'ai-dev-suite', 'rag.log'),
  electron: '/tmp/ai-dev-suite-electron.log',
};

ipcMain.handle('debug:readLog', (_ev, name: 'api' | 'ollama' | 'a2a' | 'rag' | 'electron') => {
  const p = LOG_PATHS[name];
  if (!p || !existsSync(p)) return { lines: [], error: null };
  try {
    const content = readFileSync(p, 'utf-8');
    const allLines = content.split('\n').filter((l) => l.trim() !== '');
    if (sessionLogLastRead[name] === undefined) {
      sessionLogLastRead[name] = allLines.length;
      return { lines: [], error: null };
    }
    const newLines = allLines.slice(sessionLogLastRead[name]);
    sessionLogLastRead[name] = allLines.length;
    return { lines: newLines, error: null };
  } catch (e) {
    return { lines: [], error: String(e) };
  }
});

// Save session logs on quit (called by renderer before quitApp)
ipcMain.handle('debug:saveSessionLogs', (_ev, payload: { api: string[]; ollama: string[]; a2a: string[]; rag: string[]; electron: string[] }) => {
  const sessionsDir = path.join(os.homedir(), '.config', 'ai-dev-suite', 'debugger_sessions');
  try {
    if (!existsSync(sessionsDir)) mkdirSync(sessionsDir, { recursive: true });
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '');
    const outPath = path.join(sessionsDir, `debugger_${timestamp}.log`);
    const sections = [
      ['[API]', payload.api],
      ['[OLLAMA]', payload.ollama],
      ['[A2A]', payload.a2a],
      ['[RAG]', payload.rag],
      ['[ELECTRON]', payload.electron],
    ];
    const body = sections
      .filter(([, lines]) => lines.length > 0)
      .map(([label, lines]) => `${label}\n${(lines as string[]).join('\n')}`)
      .join('\n\n---\n\n');
    if (body) writeFileSync(outPath, body, 'utf-8');
    return { path: outPath, error: null };
  } catch (e) {
    return { path: '', error: String(e) };
  }
});

// Quit app (called after saving session logs)
ipcMain.handle('app:quit', () => {
  app.quit();
});

// IPC: check health (API, Ollama, Vite)
ipcMain.handle('debug:getHealth', async () => {
  const api = await fetch('http://localhost:41434/api/ollama/models', { signal: AbortSignal.timeout(2000) }).then(r => r.status).catch(() => 0);
  const ollama = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) }).then(r => r.status).catch(() => 0);
  const vite = await fetch('http://localhost:5174/', { signal: AbortSignal.timeout(2000) }).then(r => r.status).catch(() => 0);
  return {
    api: api === 200 || api === 500 ? String(api) : 'down',
    ollama: ollama === 200 ? String(ollama) : 'down',
    vite: vite === 200 ? String(vite) : 'down',
  };
});

// IPC: run test chat
ipcMain.handle('debug:runTestChat', async () => {
  let model = 'llama3.1:latest';
  try {
    const r = await fetch('http://localhost:41434/api/ollama/models', { signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      const j = await r.json();
      const models = (j as { models?: { name?: string }[] }).models;
      if (models?.[0]?.name) model = models[0].name;
    }
  } catch {
    return { ok: false, output: '', error: 'API not reachable' };
  }
  const body = JSON.stringify({
    model,
    messages: [{ role: 'user', content: 'hi' }],
    knowledge_base: 'default',
  });
  try {
    const res = await fetch('http://localhost:41434/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return { ok: false, output: '', error: `HTTP ${res.status}` };
    const reader = res.body?.getReader();
    if (!reader) return { ok: false, output: '', error: 'No body' };
    const decoder = new TextDecoder();
    let out = '';
    for (let i = 0; i < 30; i++) {
      const { done, value } = await reader.read();
      if (done) break;
      out += decoder.decode(value, { stream: true });
    }
    return { ok: true, output: out.split('\n').slice(0, 25).join('\n'), error: null };
  } catch (e) {
    return { ok: false, output: '', error: String(e) };
  }
});

// IPC: list Ollama models from /api/tags
ipcMain.handle('debug:getOllamaModels', async () => {
  try {
    const r = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return { models: [], error: `HTTP ${r.status}` };
    const j = (await r.json()) as { models?: { name?: string; model?: string }[] };
    const raw = j.models ?? [];
    const models = raw.map((m) => (m.name ?? m.model ?? '').trim()).filter(Boolean);
    return { models, error: null };
  } catch (e) {
    return { models: [], error: String(e) };
  }
});

// Fallback list when Suite API is down (same as ai-dev-suite)
const DOWNLOADABLE_MODELS = [
  'llama3.2', 'llama3.1', 'mistral', 'mixtral', 'qwen2.5:7b', 'qwen2.5:14b',
  'qwen2.5-coder:7b', 'qwen2.5-coder:14b', 'codellama', 'phi3', 'gemma2',
  'deepseek-coder', 'neural-chat', 'orca-mini', 'command-r',
];

// IPC: list models available to download (from Suite API or fallback)
ipcMain.handle('debug:getDownloadableModels', async () => {
  try {
    const r = await fetch('http://localhost:41434/api/downloadable_models', { signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      const j = (await r.json()) as { models?: string[] };
      return { models: j.models ?? DOWNLOADABLE_MODELS, error: null };
    }
  } catch {
    /* Suite API down */
  }
  return { models: DOWNLOADABLE_MODELS, error: null };
});

// IPC: pull (download) an Ollama model
ipcMain.handle('debug:pullModel', async (_ev, name: string) => {
  const model = (name || '').trim();
  if (!model) return { ok: false, output: '', error: 'Model name required' };
  try {
    const result = execFileSync('ollama', ['pull', model], {
      encoding: 'utf-8',
      timeout: 600_000, // 10 min
      cwd: getProjectRoot(),
    });
    return { ok: true, output: result || '(pulled)', error: null };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    const out = [err.stdout, err.stderr, err.message].filter(Boolean).join('\n') || String(e);
    return { ok: false, output: out, error: String(e) };
  }
});

// IPC: get Suite's preferred model (same as Chat uses) from API preferences
ipcMain.handle('debug:getSuitePreferredModel', async () => {
  try {
    const r = await fetch('http://localhost:41434/api/preferences', { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return { preferredModel: null, error: null };
    const j = (await r.json()) as { preferred_model?: string; preferredModel?: string };
    const m = (j.preferred_model ?? j.preferredModel ?? '').trim();
    return { preferredModel: m || null, error: null };
  } catch {
    return { preferredModel: null, error: null };
  }
});

// Resolve Ollama model: use first from /api/tags; prefer DEBUG_MODEL or qwen2.5-coder if installed
async function resolveOllamaModel(): Promise<{ model: string; hasModels: boolean }> {
  const preferred = process.env.DEBUG_MODEL || 'qwen2.5-coder:3b';
  const preferredBase = preferred.split(':')[0];
  try {
    const r = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return { model: preferred, hasModels: false };
    const j = (await r.json()) as { models?: { name?: string; model?: string }[] };
    const models = j.models ?? [];
    if (models.length === 0) return { model: preferred, hasModels: false };
    const getName = (m: { name?: string; model?: string }) => (m.name ?? m.model ?? '').trim();
    const exact = models.find((m) => getName(m) === preferred);
    if (exact) return { model: getName(exact), hasModels: true };
    const sameFamily = models.find((m) => {
      const n = getName(m);
      return n.startsWith(preferredBase + ':');
    });
    if (sameFamily) return { model: getName(sameFamily), hasModels: true };
    return { model: getName(models[0]), hasModels: true };
  } catch {
    return { model: preferred, hasModels: false };
  }
}

// IPC: run analysis – includes past fixes from memory for RAG-style recall (model optional, uses resolveOllamaModel if null)
ipcMain.handle('debug:runAnalysis', async (_ev, payload: { context: string; model?: string | null }) => {
  const ctx = typeof payload === 'string' ? payload : payload.context;
  let model = typeof payload === 'object' && payload?.model ? payload.model : null;
  if (!model) {
    const res = await resolveOllamaModel();
    if (!res.hasModels) return { ok: false, text: '', error: 'No Ollama models found. Run: ollama pull llama3.2' };
    model = res.model;
  }
  const memoryPath = getDebuggerMemoryPath();
  let memoryContent = '';
  if (existsSync(memoryPath)) {
    try {
      memoryContent = readFileSync(memoryPath, 'utf-8');
    } catch {
      /* ignore */
    }
  }
  const memoryBlock = memoryContent.trim()
    ? `\n\n**Past fixes you suggested (for reference):**\n${memoryContent}\n---\n`
    : '';
  const prompt =
    'You are a debugging assistant for an AI chat app (Ollama + Elixir API + Electron). ' +
    'You have visibility into processes, terminals, and files. ' +
    'Edit file (read/write): Choose file → Read → edit → Write. Allowed: project root, ~/.config/ai-dev-suite. Cannot write to /tmp. ' +
    'Analyze the debug output. For each problem: Problem: [what is wrong]. Suggestion: [how to fix]. ' +
    'Include exact commands for Run fix box; or file edits (path + full content for Edit file). User approves all changes. 2–5 bullets. Suggest only.' +
    memoryBlock;
  const body = JSON.stringify({
    model,
    messages: [{ role: 'user', content: `${prompt}\n\nCurrent debug context:\n\n${ctx}` }],
    stream: false,
  });
  try {
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(180000),
    });
    if (!res.ok) return { ok: false, text: '', error: `HTTP ${res.status}` };
    const j = (await res.json()) as { message?: { content?: string } };
    const text = j.message?.content || '';
    if (text.trim()) {
      const dir = path.dirname(memoryPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const block = `\n## ${date}\n**Issue:** ${ctx.slice(0, 300)}\n**Fix:**\n${text.trim()}\n`;
      appendFileSync(memoryPath, block, 'utf-8');
    }
    return { ok: true, text, error: null };
  } catch (e) {
    const msg = String(e);
    return { ok: false, text: '', error: msg.includes('timeout') ? 'Analysis timed out (3 min). Try a smaller model or ensure Ollama is responsive.' : msg };
  }
});

// IPC: chat with debugger (Ollama) – multi-turn conversation with RAG memory (model optional)
ipcMain.handle('debug:chat', async (_ev, payload: { messages: { role: string; content: string }[]; context?: string; model?: string | null }) => {
  let model = payload.model;
  if (!model) {
    const res = await resolveOllamaModel();
    if (!res.hasModels) return { ok: false, text: '', error: 'No Ollama models found. Run: ollama pull llama3.2' };
    model = res.model;
  }
  let memoryContent = '';
  const memoryPath = getDebuggerMemoryPath();
  if (existsSync(memoryPath)) {
    try {
      memoryContent = readFileSync(memoryPath, 'utf-8');
    } catch {
      /* ignore */
    }
  }
  const memoryBlock = memoryContent.trim()
    ? `\n\n**Past fixes you suggested (for reference):**\n${memoryContent.slice(-6000)}\n---\n`
    : '';
  const systemPrompt =
    'You are the AI Dev Suite Debugger. You help users debug their AI chat app (Ollama + Elixir API + Electron). ' +
    'You have visibility into processes, logs, and files. ' +
    'Edit file (read/write): Choose file → Read → edit → Write. Allowed: project root, ~/.config/ai-dev-suite. Cannot write to /tmp. ' +
    'Give Problem/Suggestion format. Include exact commands for Run fix box, or file path + full content for Edit file. Suggest only; user approves. ' +
    'Reference past fixes above when relevant.';
  const contextBlock = payload.context?.trim()
    ? `\n\n**Current system context:**\n${payload.context.slice(0, 4000)}\n---\n`
    : '';
  const sysMsg = { role: 'system', content: systemPrompt + memoryBlock + contextBlock };
  const messages = [sysMsg, ...payload.messages];
  const body = JSON.stringify({ model, messages, stream: false });
  try {
    const res = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(300000),
    });
    if (!res.ok) {
      const errBody = await res.text();
      let msg = `HTTP ${res.status}`;
      try {
        const j = JSON.parse(errBody) as { error?: string };
        if (j.error) msg += `: ${j.error}`;
      } catch {
        /* ignore */
      }
      return { ok: false, text: '', error: msg };
    }
    const j = (await res.json()) as { message?: { content?: string } };
    const text = j.message?.content || '';
    return { ok: true, text, error: null };
  } catch (e) {
    const msg = String(e);
    return { ok: false, text: '', error: msg.includes('timeout') ? 'Chat timed out (5 min). Try a smaller model or ensure Ollama is responsive.' : msg };
  }
});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
