import { useState, useEffect, useCallback } from 'react';

type Health = { api: string; ollama: string; vite: string } | null;

function StatusCard({ label, value, port }: { label: string; value: string; port: number }) {
  const ok = value !== 'down' && value !== '0';
  return (
    <div className={`rounded-lg border px-4 py-2 ${ok ? 'border-green-500/50 bg-green-500/10' : 'border-whynot-border bg-whynot-surface'}`}>
      <div className="text-xs text-whynot-muted">{label} :{port}</div>
      <div className={`font-mono text-sm font-medium ${ok ? 'text-green-400' : 'text-whynot-muted'}`}>
        {ok ? value : 'down'}
      </div>
    </div>
  );
}

function LogPanel({ title, lines, loading }: { title: string; lines: string[]; loading?: boolean }) {
  return (
    <div className="flex flex-col rounded-lg border border-whynot-border bg-whynot-surface overflow-hidden flex-1 min-h-0">
      <div className="px-3 py-2 border-b border-whynot-border text-sm font-medium text-whynot-body">{title}</div>
      <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-whynot-muted leading-relaxed m-0">
        {loading ? 'Loading...' : lines.length ? lines.join('\n') : '(no log)'}
      </pre>
    </div>
  );
}

export default function App() {
  const [health, setHealth] = useState<Health>(null);
  const [apiLog, setApiLog] = useState<string[]>([]);
  const [ollamaLog, setOllamaLog] = useState<string[]>([]);
  const [a2aLog, setA2aLog] = useState<string[]>([]);
  const [ragLog, setRagLog] = useState<string[]>([]);
  const [electronLog, setElectronLog] = useState<string[]>([]);
  const [secondaryLogSource, setSecondaryLogSource] = useState<'ollama' | 'a2a' | 'rag' | 'electron'>('ollama');
  const [logsLoading, setLogsLoading] = useState(true);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [memoryContent, setMemoryContent] = useState<string | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);
  const [processes, setProcesses] = useState<{ header: string; terminals: string[]; relevant: string[] } | null>(null);
  const [files, setFiles] = useState<{ configFiles: string[]; logFiles: { path: string; size: number }[]; projectFiles: string[] } | null>(null);
  const [systemLoading, setSystemLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [startLoading, setStartLoading] = useState<'api' | 'ollama' | null>(null);
  const [runCmd, setRunCmd] = useState('');
  const [runOutput, setRunOutput] = useState<string | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [editFileOpen, setEditFileOpen] = useState(false);
  const [editFilePath, setEditFilePath] = useState('');
  const [editFileContent, setEditFileContent] = useState('');
  const [editFileLoading, setEditFileLoading] = useState(false);
  const [editFileError, setEditFileError] = useState<string | null>(null);

  const detectedProblems = (() => {
    const problems: string[] = [];
    if (health) {
      if (health.api === 'down' || health.api === '0') problems.push('API (41434) is down');
      if (health.ollama === 'down' || health.ollama === '0') problems.push('Ollama (11434) is down');
      if (health.vite === 'down' || health.vite === '0') problems.push('Vite (5174) is down');
    }
    const errPattern = /error|exception|crash|failed|panic|timeout|refused/i;
    const apiErrLines = apiLog.filter((l) => errPattern.test(l));
    const ollamaErrLines = ollamaLog.filter((l) => errPattern.test(l));
    const ollamaBindOnly = ollamaErrLines.length > 0 && ollamaErrLines.every((l) => /bind: address already in use|11434.*in use/i.test(l));
    const ollamaUp = health?.ollama && health.ollama !== 'down' && health.ollama !== '0';
    if (apiErrLines.length > 0) problems.push(apiErrLines.length === 1 ? '1 error in API log' : `${apiErrLines.length} errors in API log`);
    if (ollamaErrLines.length > 0 && !(ollamaBindOnly && ollamaUp)) {
      if (ollamaBindOnly) problems.push('Ollama: port 11434 already in use');
      else problems.push(ollamaErrLines.length === 1 ? '1 error in Ollama log' : `${ollamaErrLines.length} errors in Ollama log`);
    }
    if (testOutput && (testOutput.includes('Error:') || testOutput.includes('(no response)'))) problems.push('Test chat failed or returned no response');
    return problems;
  })();

  const ollamaBindError = (health?.ollama === 'down' || health?.ollama === '0') && ollamaLog.some((l) => /bind: address already in use|11434.*in use/i.test(l));

  const refreshHealth = useCallback(async () => {
    const h = await window.debugApi?.getHealth?.();
    if (h) setHealth(h);
    const m = await window.debugApi?.getOllamaModels?.();
    if (m && !m.error && m.models.length) {
      setOllamaModels(m.models);
      setSelectedModel((prev) => (m.models.includes(prev) ? prev : m.models[0]));
    }
  }, []);

  const refreshLogs = useCallback(async () => {
    setLogsLoading(true);
    const [api, ollama, a2a, rag, electron] = await Promise.all([
      window.debugApi?.readLog?.('api') ?? { lines: [], error: null },
      window.debugApi?.readLog?.('ollama') ?? { lines: [], error: null },
      window.debugApi?.readLog?.('a2a') ?? { lines: [], error: null },
      window.debugApi?.readLog?.('rag') ?? { lines: [], error: null },
      window.debugApi?.readLog?.('electron') ?? { lines: [], error: null },
    ]);
    setApiLog(api.lines ?? []);
    setOllamaLog(ollama.lines ?? []);
    setA2aLog(a2a.lines ?? []);
    setRagLog(rag.lines ?? []);
    setElectronLog(electron.lines ?? []);
    setLogsLoading(false);
  }, []);

  const refreshSystem = useCallback(async () => {
    setSystemLoading(true);
    const [p, f] = await Promise.all([
      window.debugApi?.getProcesses?.() ?? { header: '', terminals: [], relevant: [], error: null },
      window.debugApi?.getFiles?.() ?? { configFiles: [], logFiles: [], projectFiles: [], error: null },
    ]);
    if (p && !p.error) setProcesses({ header: p.header, terminals: p.terminals, relevant: p.relevant });
    if (f && !f.error) setFiles({ configFiles: f.configFiles, logFiles: f.logFiles, projectFiles: f.projectFiles });
    setSystemLoading(false);
  }, []);

  const runTestChat = useCallback(async () => {
    setTestLoading(true);
    setTestOutput(null);
    const r = await window.debugApi?.runTestChat?.();
    setTestOutput(r ? (r.error ? `Error: ${r.error}` : r.output) : 'API not available');
    setTestLoading(false);
  }, []);

  const runAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysis(null);
    const [p, f] = await Promise.all([
      window.debugApi?.getProcesses?.() ?? { header: '', terminals: [], relevant: [], error: null },
      window.debugApi?.getFiles?.() ?? { configFiles: [], logFiles: [], projectFiles: [], error: null },
    ]);
    if (p && !p.error) setProcesses({ header: p.header, terminals: p.terminals, relevant: p.relevant });
    if (f && !f.error) setFiles({ configFiles: f.configFiles, logFiles: f.logFiles, projectFiles: f.projectFiles });
    const ctx = [
      `API: ${health?.api ?? '?'} | Ollama: ${health?.ollama ?? '?'} | Vite: ${health?.vite ?? '?'}`,
      '\n--- PROCESSES ---\n',
      p?.header ?? '',
      '\nRelevant (ollama, node, beam, etc):', ...(p?.relevant ?? []).slice(0, 30),
      '\nTerminals:', ...(p?.terminals ?? []).slice(0, 15),
      '\n--- FILES ---\n',
      'Config:', ...(f?.configFiles ?? []),
      'Logs:', ...(f?.logFiles ?? []).map((lf) => `${lf.path} ${lf.size}B`),
      'Project:', ...(f?.projectFiles ?? []),
      '\n--- LOGS ---\n',
      'API log:', ...apiLog.slice(-15),
      'Ollama log:', ...ollamaLog.slice(-15),
      a2aLog.length ? ['\nA2A log:', ...a2aLog.slice(-15)].join('\n') : '',
      ragLog.length ? ['\nRAG log:', ...ragLog.slice(-15)].join('\n') : '',
      electronLog.length ? ['\nElectron/Suite terminal log:', ...electronLog.slice(-15)].join('\n') : '',
      testOutput ? `\nTest output:\n${testOutput}` : '',
    ].join('\n');
    const r = await window.debugApi?.runAnalysis?.({ context: ctx, model: selectedModel || undefined });
    setAnalysis(r ? (r.error ? `Error: ${r.error}` : r.text) : 'API not available');
    setAnalysisLoading(false);
    if (memoryOpen) {
      const m = await window.debugApi?.getMemory?.();
      if (m && !m.error) setMemoryContent(m.content || '');
    }
  }, [health, apiLog, ollamaLog, a2aLog, ragLog, electronLog, testOutput, memoryOpen, selectedModel]);

  const sendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    const userMsg = { role: 'user' as const, content: text };
    setChatMessages((m) => [...m, userMsg]);
    setChatLoading(true);
    const [p, f] = await Promise.all([
      window.debugApi?.getProcesses?.() ?? { relevant: [], terminals: [], error: null },
      window.debugApi?.getFiles?.() ?? { configFiles: [], logFiles: [], projectFiles: [], error: null },
    ]);
    const ctx = [
      `API: ${health?.api ?? '?'} | Ollama: ${health?.ollama ?? '?'}`,
      'Relevant:', ...(p?.relevant ?? []).slice(0, 15),
      'Logs:', ...apiLog.slice(-8), ...ollamaLog.slice(-8),
      ...(a2aLog.length ? ['A2A:', ...a2aLog.slice(-5)] : []),
      ...(ragLog.length ? ['RAG:', ...ragLog.slice(-5)] : []),
      ...(electronLog.length ? ['Electron:', ...electronLog.slice(-5)] : []),
      'Files:', ...(f?.configFiles ?? []), ...(f?.projectFiles ?? []),
    ].join('\n');
    const r = await window.debugApi?.chat?.({
      messages: [...chatMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
      context: ctx,
      model: selectedModel || undefined,
    });
    const assistantText = r?.ok ? (r.text || '(no response)') : `Error: ${r?.error ?? 'unknown'}`;
    setChatMessages((m) => [...m, { role: 'assistant', content: assistantText }]);
    setChatLoading(false);
  }, [chatInput, chatLoading, chatMessages, health, apiLog, ollamaLog, a2aLog, ragLog, electronLog, selectedModel]);

  const startApi = useCallback(async () => {
    setStartLoading('api');
    const r = await window.debugApi?.startScript?.('api');
    setRunOutput(r ? (r.error ? `Error: ${r.error}` : r.output) : 'Not available');
    setStartLoading(null);
    setTimeout(() => refreshHealth(), 2000);
    setTimeout(() => refreshLogs(), 1500);
  }, []);

  const freeOllamaPort = useCallback(async () => {
    setRunLoading(true);
    setRunOutput(null);
    const r = await window.debugApi?.freePort?.(11434);
    setRunOutput(r?.ok ? (r.output || 'Port 11434 freed.') : (r?.error || 'Could not free port.'));
    setRunLoading(false);
    setTimeout(() => refreshLogs(), 1000);
  }, []);

  const startOllama = useCallback(async () => {
    setStartLoading('ollama');
    const r = await window.debugApi?.startScript?.('ollama');
    setRunOutput(r ? (r.error ? `Error: ${r.error}` : r.output) : 'Not available');
    setStartLoading(null);
    setTimeout(() => refreshHealth(), 2000);
    setTimeout(() => refreshLogs(), 1500);
  }, []);

  const chooseFileToRun = useCallback(async () => {
    const r = await window.debugApi?.selectFile?.();
    if (r?.path) setRunCmd(`bash "${r.path}"`);
  }, []);

  const chooseFileToEdit = useCallback(async () => {
    const r = await window.debugApi?.selectFileForEdit?.();
    if (r?.path) {
      setEditFilePath(r.path);
      setEditFileContent('');
      setEditFileError(null);
      setEditFileOpen(true);
    }
  }, []);

  const loadFileForEdit = useCallback(async () => {
    if (!editFilePath || editFileLoading) return;
    setEditFileLoading(true);
    setEditFileError(null);
    const r = await window.debugApi?.readFile?.(editFilePath);
    setEditFileContent(r?.content ?? '');
    setEditFileError(r?.error ?? null);
    setEditFileLoading(false);
  }, [editFilePath, editFileLoading]);

  const saveEditedFile = useCallback(async () => {
    if (!editFilePath || editFileLoading) return;
    setEditFileLoading(true);
    setEditFileError(null);
    const r = await window.debugApi?.writeFile?.(editFilePath, editFileContent);
    setEditFileError(r?.ok ? null : (r?.error ?? 'Write failed'));
    setEditFileLoading(false);
  }, [editFilePath, editFileContent, editFileLoading]);

  const runFixCommand = useCallback(async () => {
    const cmd = runCmd.trim();
    if (!cmd || runLoading) return;
    setRunLoading(true);
    setRunOutput(null);
    const r = await window.debugApi?.runCommand?.(cmd);
    setRunOutput(r ? (r.error ? `Error: ${r.error}\n${r.output}` : r.output) : 'Not available');
    setRunLoading(false);
  }, [runCmd, runLoading]);

  const showMemory = useCallback(async () => {
    setMemoryOpen((prev) => {
      if (!prev) {
        window.debugApi?.getMemory?.().then((m) => {
          if (m && !m.error) setMemoryContent(m.content || '(empty – run analysis to build memory)');
        });
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    refreshHealth();
    const t = setInterval(refreshHealth, 10000);
    return () => clearInterval(t);
  }, [refreshHealth]);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  return (
    <div className="min-h-screen bg-whynot-bg dots-bg flex flex-col">
      <header className="border-b border-whynot-border bg-whynot-surface/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center justify-between h-14 px-6">
          <h1 className="text-lg font-semibold">
            <span className="text-whynot-accent">AI Dev Suite</span>
            <span className="text-whynot-body"> Debugger</span>
          </h1>
          <div className="flex items-center gap-3">
            {health && (
              <div className="flex gap-2">
                <StatusCard label="API" value={health.api} port={41434} />
                <StatusCard label="Ollama" value={health.ollama} port={11434} />
                <StatusCard label="Vite" value={health.vite} port={5174} />
              </div>
            )}
            {ollamaModels.length > 0 && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="rounded border border-whynot-border bg-whynot-bg px-2 py-1.5 text-xs font-mono text-whynot-body focus:outline-none focus:ring-1 focus:ring-whynot-accent"
              >
                {ollamaModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}
            <button
              onClick={refreshHealth}
              className="px-3 py-1.5 rounded text-sm text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/50"
            >
              ↻ Refresh
            </button>
            <button
              onClick={refreshLogs}
              className="px-3 py-1.5 rounded text-sm text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/50"
            >
              Logs
            </button>
            <button
              onClick={showMemory}
              className={`px-3 py-1.5 rounded text-sm ${memoryOpen ? 'text-whynot-accent bg-whynot-accent/10' : 'text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/50'}`}
            >
              Past fixes
            </button>
            <button
              onClick={() => {
                setSystemOpen((o) => !o);
                if (!systemOpen) refreshSystem();
              }}
              className={`px-3 py-1.5 rounded text-sm ${systemOpen ? 'text-whynot-accent bg-whynot-accent/10' : 'text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/50'}`}
            >
              System
            </button>
            <button
              onClick={() => setChatOpen((o) => !o)}
              className={`px-3 py-1.5 rounded text-sm ${chatOpen ? 'text-whynot-accent bg-whynot-accent/10' : 'text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/50'}`}
            >
              Chat
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-auto flex flex-col gap-4">
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200/90">
          <strong>Suggestions only.</strong> No fixes are applied automatically. You decide which to implement.
        </div>

        {detectedProblems.length > 0 && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-red-200">
              Problems detected: {detectedProblems.join(' · ')}
            </span>
            {((health?.api === 'down' || health?.api === '0') && (
              <button
                onClick={startApi}
                disabled={startLoading !== null}
                className="px-3 py-1.5 rounded bg-red-500/30 text-red-200 hover:bg-red-500/40 disabled:opacity-50 text-sm font-medium"
              >
                {startLoading === 'api' ? 'Starting…' : '▶ Start API'}
              </button>
            ))}
            {((health?.ollama === 'down' || health?.ollama === '0') && (
              <button
                onClick={startOllama}
                disabled={startLoading !== null}
                className="px-3 py-1.5 rounded bg-red-500/30 text-red-200 hover:bg-red-500/40 disabled:opacity-50 text-sm font-medium"
              >
                {startLoading === 'ollama' ? 'Starting…' : '▶ Start Ollama'}
              </button>
            ))}
            {ollamaBindError && (
              <button
                onClick={freeOllamaPort}
                disabled={runLoading}
                className="px-3 py-1.5 rounded bg-amber-600/30 text-amber-200 hover:bg-amber-600/40 disabled:opacity-50 text-sm font-medium"
              >
                {runLoading ? 'Freeing…' : 'Free port 11434'}
              </button>
            )}
            <button
              onClick={runAnalysis}
              disabled={analysisLoading}
              className="px-3 py-1.5 rounded bg-red-500/30 text-red-200 hover:bg-red-500/40 disabled:opacity-50 text-sm font-medium"
            >
              {analysisLoading ? 'Getting suggestions…' : 'Get fix suggestions'}
            </button>
          </div>
        )}

        <div className="rounded-lg border border-whynot-border bg-whynot-surface px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-sm text-whynot-muted">Run fix (ollama, mix, npm, bash):</span>
          <input
            type="text"
            value={runCmd}
            onChange={(e) => setRunCmd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), runFixCommand())}
            placeholder="e.g. ollama pull qwen2.5-coder:3b"
            className="flex-1 min-w-[200px] rounded border border-whynot-border bg-whynot-bg px-3 py-1.5 text-sm font-mono text-whynot-body placeholder:text-whynot-muted"
          />
          <button
            onClick={chooseFileToRun}
            className="px-3 py-1.5 rounded border border-whynot-border text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/30 text-sm font-medium"
          >
            Choose file
          </button>
          <button
            onClick={runFixCommand}
            disabled={runLoading || !runCmd.trim()}
            className="px-3 py-1.5 rounded bg-green-600/30 text-green-300 hover:bg-green-600/40 disabled:opacity-50 text-sm font-medium"
          >
            {runLoading ? 'Running…' : '▶ Run'}
          </button>
        </div>
        {runOutput !== null && (
          <pre className="rounded-lg border border-whynot-border bg-whynot-surface p-3 text-xs font-mono text-whynot-muted overflow-auto max-h-32">{runOutput}</pre>
        )}

        <div className="rounded-lg border border-whynot-border bg-whynot-surface overflow-hidden">
          <button
            type="button"
            onClick={() => setEditFileOpen((o) => !o)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm text-whynot-body hover:bg-whynot-border/30"
          >
            <span className="font-medium">Edit file (read/write)</span>
            <span>{editFileOpen ? '−' : '+'}</span>
          </button>
          {editFileOpen && (
            <div className="px-4 pb-4 pt-2 border-t border-whynot-border space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={chooseFileToEdit}
                  className="px-3 py-1.5 rounded border border-whynot-border text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/30 text-sm font-medium"
                >
                  Choose file
                </button>
                {editFilePath && (
                  <>
                    <span className="text-xs font-mono text-whynot-muted truncate max-w-[200px]">{editFilePath}</span>
                    <button
                      onClick={loadFileForEdit}
                      disabled={editFileLoading}
                      className="px-3 py-1.5 rounded border border-whynot-border text-whynot-muted hover:text-whynot-body disabled:opacity-50 text-sm"
                    >
                      Read
                    </button>
                    <button
                      onClick={saveEditedFile}
                      disabled={editFileLoading}
                      className="px-3 py-1.5 rounded bg-green-600/30 text-green-300 hover:bg-green-600/40 disabled:opacity-50 text-sm font-medium"
                    >
                      {editFileLoading ? '…' : 'Write'}
                    </button>
                  </>
                )}
              </div>
              {editFilePath && (
                <textarea
                  value={editFileContent}
                  onChange={(e) => setEditFileContent(e.target.value)}
                  placeholder="Choose file and click Read to load, or paste content to write"
                  className="w-full h-40 rounded border border-whynot-border bg-whynot-bg px-3 py-2 text-xs font-mono text-whynot-body placeholder:text-whynot-muted resize-y"
                />
              )}
              {editFileError && <p className="text-xs text-red-400">{editFileError}</p>}
              <p className="text-xs text-whynot-muted">Allowed: project root, ~/.config/ai-dev-suite. Cannot write to /tmp.</p>
            </div>
          )}
        </div>

        {chatOpen && (
          <div className="rounded-lg border border-whynot-accent/30 bg-whynot-surface overflow-hidden flex flex-col" style={{ minHeight: 280 }}>
            <div className="px-3 py-2 border-b border-whynot-accent/30 text-sm font-medium text-whynot-accent">Chat with Debugger</div>
            <div className="flex-1 overflow-auto p-3 space-y-3 min-h-0">
              {chatMessages.length === 0 && (
                <p className="text-sm text-whynot-muted">Ask about logs, processes, or what to fix. Context is sent with each message.</p>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-whynot-accent/20 text-whynot-body' : 'bg-whynot-border/30 text-whynot-body'}`}>
                    <div className="text-xs text-whynot-muted mb-1">{m.role === 'user' ? 'You' : 'Debugger'}</div>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  </div>
                </div>
              ))}
              {chatLoading && <div className="text-sm text-whynot-muted">…</div>}
            </div>
            <div className="p-3 border-t border-whynot-border flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChat())}
                placeholder="Ask about logs, processes, or fixes..."
                className="flex-1 rounded-lg border border-whynot-border bg-whynot-bg px-3 py-2 text-sm text-whynot-body placeholder:text-whynot-muted focus:outline-none focus:ring-1 focus:ring-whynot-accent"
              />
              <button
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 rounded-lg bg-whynot-accent/30 text-whynot-accent hover:bg-whynot-accent/40 disabled:opacity-50 text-sm font-medium"
              >
                Send
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={runTestChat}
            disabled={testLoading}
            className="px-4 py-2 rounded-lg bg-whynot-accent/20 text-whynot-accent hover:bg-whynot-accent/30 disabled:opacity-50 text-sm font-medium"
          >
            {testLoading ? 'Running…' : '▶ Test Chat'}
          </button>
          <button
            onClick={runAnalysis}
            disabled={analysisLoading}
            className="px-4 py-2 rounded-lg border border-whynot-accent/50 text-whynot-accent hover:bg-whynot-accent/10 disabled:opacity-50 text-sm font-medium"
          >
            {analysisLoading ? 'Analyzing…' : `🔍 Ask ${selectedModel || 'model'}`}
          </button>
        </div>

        {testOutput !== null && (
          <div className="rounded-lg border border-whynot-border bg-whynot-surface overflow-hidden">
            <div className="px-3 py-2 border-b border-whynot-border text-sm font-medium">Test Chat Output</div>
            <pre className="p-3 text-xs font-mono text-whynot-muted overflow-auto max-h-40">{testOutput}</pre>
          </div>
        )}

        {analysis !== null && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 overflow-hidden">
            <div className="px-3 py-2 border-b border-green-500/30 text-sm font-medium text-green-400">Debug Assistant — suggestions (no auto-apply)</div>
            <div className="p-3 text-sm text-whynot-body whitespace-pre-wrap">{analysis}</div>
          </div>
        )}

        {systemOpen && (
          <div className="rounded-lg border border-whynot-border bg-whynot-surface overflow-hidden">
            <div className="px-3 py-2 border-b border-whynot-border flex justify-between items-center">
              <span className="text-sm font-medium text-whynot-body">Processes, terminals, files</span>
              <button onClick={refreshSystem} disabled={systemLoading} className="text-xs text-whynot-muted hover:text-whynot-body disabled:opacity-50">↻ Refresh</button>
            </div>
            <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <div className="text-whynot-accent font-medium mb-1">Relevant processes (ollama, node, beam…)</div>
                <pre className="text-whynot-muted overflow-auto max-h-32 whitespace-pre-wrap">{systemLoading ? 'Loading...' : processes?.relevant?.length ? processes.relevant.join('\n') : '(none)'}</pre>
              </div>
              <div>
                <div className="text-whynot-accent font-medium mb-1">Terminals</div>
                <pre className="text-whynot-muted overflow-auto max-h-32 whitespace-pre-wrap">{systemLoading ? 'Loading...' : processes?.terminals?.length ? processes.terminals.join('\n') : '(none)'}</pre>
              </div>
              <div>
                <div className="text-whynot-accent font-medium mb-1">Config & project files</div>
                <pre className="text-whynot-muted overflow-auto max-h-32 whitespace-pre-wrap">{systemLoading ? 'Loading...' : files ? [...files.configFiles, ...files.logFiles.map((l) => l.path), ...files.projectFiles].filter(Boolean).join('\n') || '(none)' : '(none)'}</pre>
              </div>
            </div>
          </div>
        )}

        {memoryOpen && (
          <div className="rounded-lg border border-whynot-accent/30 bg-whynot-accent/5 overflow-hidden">
            <div className="px-3 py-2 border-b border-whynot-accent/30 text-sm font-medium text-whynot-accent">Past fixes (RAG memory)</div>
            <pre className="p-3 text-xs font-mono text-whynot-muted overflow-auto max-h-48 whitespace-pre-wrap">{memoryContent ?? 'Loading...'}</pre>
          </div>
        )}

        <div className="flex-1 flex gap-4 min-h-0" style={{ minHeight: 240 }}>
          <LogPanel title="API log (last 50 lines)" lines={apiLog} loading={logsLoading} />
          <div className="flex flex-col flex-1 min-h-0 rounded-lg border border-whynot-border bg-whynot-surface overflow-hidden">
            <div className="px-3 py-2 border-b border-whynot-border flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-whynot-body">Suite log</span>
              <select
                value={secondaryLogSource}
                onChange={(e) => setSecondaryLogSource(e.target.value as typeof secondaryLogSource)}
                className="rounded border border-whynot-border bg-whynot-bg px-2 py-1 text-xs font-mono text-whynot-body focus:outline-none focus:ring-1 focus:ring-whynot-accent"
              >
                <option value="ollama">Ollama</option>
                <option value="a2a">A2A agent</option>
                <option value="rag">RAG</option>
                <option value="electron">Electron / terminal</option>
              </select>
            </div>
            <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-whynot-muted leading-relaxed m-0">
              {logsLoading ? 'Loading...' : (secondaryLogSource === 'ollama' ? ollamaLog : secondaryLogSource === 'a2a' ? a2aLog : secondaryLogSource === 'rag' ? ragLog : electronLog).length
                ? (secondaryLogSource === 'ollama' ? ollamaLog : secondaryLogSource === 'a2a' ? a2aLog : secondaryLogSource === 'rag' ? ragLog : electronLog).join('\n')
                : '(no log)'}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
