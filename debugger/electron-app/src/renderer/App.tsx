import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadableModels, setDownloadableModels] = useState<string[]>([]);
  const [pullLoading, setPullLoading] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [observerOpen, setObserverOpen] = useState(true);
  const [observerChatMessages, setObserverChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [observerChatInput, setObserverChatInput] = useState('');
  const [observerChatLoading, setObserverChatLoading] = useState(false);
  const [refreshHealthLoading, setRefreshHealthLoading] = useState(false);
  const [refreshLogsLoading, setRefreshLogsLoading] = useState(false);
  const logsSectionRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  const detectedProblems = (() => {
    const problems: string[] = [];
    if (health) {
      if (health.api === 'down' || health.api === '0') problems.push('API (41434) is down');
      if (health.ollama === 'down' || health.ollama === '0') problems.push('Ollama (11434) is down');
      // Vite (5174) is optional – only used by ./start-ai-dev-suite-web.sh; Electron/TUI don't need it
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
    setRefreshHealthLoading(true);
    const start = Date.now();
    try {
      const h = await window.debugApi?.getHealth?.();
      if (h) setHealth(h);
      const [modelRes, prefsRes] = await Promise.all([
        window.debugApi?.getOllamaModels?.(),
        window.debugApi?.getSuitePreferredModel?.(),
      ]);
      if (modelRes && !modelRes.error && modelRes.models.length) {
        setOllamaModels(modelRes.models);
        const preferred = prefsRes?.preferredModel;
        const usePreferred = preferred && modelRes.models.includes(preferred);
        setSelectedModel((prev) => {
          if (usePreferred) return preferred;
          if (modelRes.models.includes(prev)) return prev;
          return modelRes.models[0];
        });
      }
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      const elapsed = Date.now() - start;
      if (elapsed < 300) await new Promise((r) => setTimeout(r, 300 - elapsed));
      setRefreshHealthLoading(false);
    }
  }, []);

  const refreshLogs = useCallback(async (opts?: { silent?: boolean; scrollToLogs?: boolean }) => {
    const silent = opts?.silent ?? false;
    const scrollToLogs = opts?.scrollToLogs ?? false;
    if (!silent) {
      setRefreshLogsLoading(true);
      setLogsLoading(true);
    }
    const start = Date.now();
    try {
      const [api, ollama, a2a, rag, electron] = await Promise.all([
        window.debugApi?.readLog?.('api') ?? { lines: [], error: null },
        window.debugApi?.readLog?.('ollama') ?? { lines: [], error: null },
        window.debugApi?.readLog?.('a2a') ?? { lines: [], error: null },
        window.debugApi?.readLog?.('rag') ?? { lines: [], error: null },
        window.debugApi?.readLog?.('electron') ?? { lines: [], error: null },
      ]);
      setApiLog(api?.lines ?? []);
      setOllamaLog(ollama?.lines ?? []);
      setA2aLog(a2a?.lines ?? []);
      setRagLog(rag?.lines ?? []);
      setElectronLog(electron?.lines ?? []);
    } catch (e) {
      if (!silent) console.error('Logs failed:', e);
    } finally {
      if (!silent) {
        const elapsed = Date.now() - start;
        if (elapsed < 300) await new Promise((r) => setTimeout(r, 300 - elapsed));
        setLogsLoading(false);
        setRefreshLogsLoading(false);
      }
      if (scrollToLogs) logsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
    const [p, f, apiRes, ollamaRes] = await Promise.all([
      window.debugApi?.getProcesses?.() ?? { header: '', terminals: [], relevant: [], error: null },
      window.debugApi?.getFiles?.() ?? { configFiles: [], logFiles: [], projectFiles: [], error: null },
      window.debugApi?.readLog?.('api') ?? { lines: [], error: null },
      window.debugApi?.readLog?.('ollama') ?? { lines: [], error: null },
    ]);
    if (p && !p.error) setProcesses({ header: p.header, terminals: p.terminals, relevant: p.relevant });
    if (f && !f.error) setFiles({ configFiles: f.configFiles, logFiles: f.logFiles, projectFiles: f.projectFiles });
    const apiLogFresh = apiRes?.lines ?? apiLog;
    const ollamaLogFresh = ollamaRes?.lines ?? ollamaLog;
    setApiLog(apiLogFresh);
    setOllamaLog(ollamaLogFresh);
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
      'API log:', ...apiLogFresh.slice(-15),
      'Ollama log:', ...ollamaLogFresh.slice(-15),
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

  const runObserverCheck = useCallback(async () => {
    await runTestChat();
    await runAnalysis();
  }, [runTestChat, runAnalysis]);

  const sendObserverChat = useCallback(async () => {
    const text = observerChatInput.trim();
    if (!text || observerChatLoading) return;
    setObserverChatInput('');
    const userMsg = { role: 'user' as const, content: text };
    setObserverChatMessages((m) => [...m, userMsg]);
    setObserverChatLoading(true);
    const [p, f] = await Promise.all([
      window.debugApi?.getProcesses?.() ?? { relevant: [], terminals: [], error: null },
      window.debugApi?.getFiles?.() ?? { configFiles: [], logFiles: [], projectFiles: [], error: null },
    ]);
    const ctx = [
      `API: ${health?.api ?? '?'} | Ollama: ${health?.ollama ?? '?'}`,
      'Relevant:', ...(p?.relevant ?? []).slice(0, 15),
      'Logs:', ...apiLog.slice(-8), ...ollamaLog.slice(-8),
    ].join('\n');
    const r = await window.debugApi?.chat?.({
      messages: [...observerChatMessages, userMsg].map((m) => ({ role: m.role, content: m.content })),
      context: ctx,
      model: selectedModel || undefined,
    });
    const assistantText = r?.ok ? (r.text || '(no response)') : `Error: ${r?.error ?? 'unknown'}`;
    setObserverChatMessages((m) => [...m, { role: 'assistant', content: assistantText }]);
    setObserverChatLoading(false);
  }, [observerChatInput, observerChatLoading, observerChatMessages, health, apiLog, ollamaLog, selectedModel]);

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

  const fetchDownloadable = useCallback(async () => {
    const r = await window.debugApi?.getDownloadableModels?.();
    if (r && !r.error && r.models?.length) setDownloadableModels(r.models);
  }, []);

  const pullModel = useCallback(async (name: string) => {
    setPullLoading(name);
    const r = await window.debugApi?.pullModel?.(name);
    setPullLoading(null);
    if (r?.ok) {
      setRunOutput(r.output);
      setTimeout(() => refreshHealth(), 2000);
    } else {
      setRunOutput(r ? `Error: ${r.error}\n${r.output}` : 'Pull failed');
    }
    setDownloadOpen(false);
  }, [refreshHealth]);

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
    refreshLogs(); // initial load, no scroll
  }, [refreshLogs]);

  // Scroll to top on mount so user starts at top
  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.scrollTo?.(0, 0);
  }, []);

  // Observer: silent auto-refresh every 3s when open (no loading flash)
  useEffect(() => {
    if (!observerOpen) return;
    const t = setInterval(() => refreshLogs({ silent: true }), 3000);
    return () => clearInterval(t);
  }, [observerOpen, refreshLogs]);

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
            <button
              onClick={refreshHealth}
              disabled={refreshHealthLoading}
              className="px-3 py-1.5 rounded text-sm text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshHealthLoading ? '↻ Refreshing…' : '↻ Refresh'}
            </button>
            <button
              onClick={() => refreshLogs({ scrollToLogs: true })}
              disabled={refreshLogsLoading}
              className="px-3 py-1.5 rounded text-sm text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshLogsLoading ? 'Logs…' : 'Logs'}
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
              onClick={() => setObserverOpen((o) => !o)}
              className={`px-3 py-1.5 rounded text-sm ${observerOpen ? 'text-whynot-accent bg-whynot-accent/10' : 'text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/50'}`}
            >
              Observer
            </button>
            <button
              onClick={() => setChatOpen((o) => !o)}
              className={`px-3 py-1.5 rounded text-sm ${chatOpen ? 'text-whynot-accent bg-whynot-accent/10' : 'text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/50'}`}
            >
              Chat
            </button>
            <button
              onClick={() => setInfoOpen(true)}
              className="px-3 py-1.5 rounded text-sm text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/50"
              title="Explain all features"
            >
              ℹ Info
            </button>
          </div>
        </div>
      </header>

      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setInfoOpen(false)}>
          <div className="bg-whynot-bg border border-whynot-border rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-whynot-border flex justify-between items-center">
              <h2 className="text-lg font-semibold text-whynot-body">Debugger – What each feature does</h2>
              <button onClick={() => setInfoOpen(false)} className="text-whynot-muted hover:text-whynot-body text-xl leading-none">×</button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">Status cards (API, Ollama, Vite)</h3>
                <p className="text-whynot-muted">Shows if each service is up (green) or down. Auto-refreshes every 10s.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">Model selector</h3>
                <p className="text-whynot-muted">Pick which Ollama model to use for Chat and Ask. Synced with Suite Chat when API is up.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">↻ Refresh</h3>
                <p className="text-whynot-muted">Reload health status and model list.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">Observer</h3>
                <p className="text-whynot-muted">Logs (API + Ollama, refreshes every 3s), status line, Ask / Run check, and Observer Chat. Same chat UI as Debugger: model selector, messages with + memory, Send. Separate thread from Debugger Chat. Both use RAG memory.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">Logs</h3>
                <p className="text-whynot-muted">Load API log and a selectable Suite log (Ollama, A2A, RAG, or Electron). Last 50 lines each.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">Past fixes</h3>
                <p className="text-whynot-muted">RAG memory – fixes the model suggested. Both Observer and Chat use it. + memory on assistant messages to save.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">System</h3>
                <p className="text-whynot-muted">Processes (ollama, node, beam…), terminals, and files. Sent to the model for analysis.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">Chat with Debugger</h3>
                <p className="text-whynot-muted">Talk to the debugger. Context and RAG memory sent with each message. Suggestions only – you approve. + memory to save assistant replies.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">Timeouts</h3>
                <p className="text-whynot-muted">Chat: 5 min. Analysis: 3 min. If you see a timeout, try a smaller model (e.g. qwen2.5-coder:3b) or run <code className="rounded bg-whynot-surface px-1">ollama run &lt;model&gt;</code> to preload.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">↓ Download</h3>
                <p className="text-whynot-muted">Pull models from Ollama. Click a model to run <code className="rounded bg-whynot-surface px-1">ollama pull</code>. ✓ = already installed.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">▶ Start API / ▶ Start Ollama</h3>
                <p className="text-whynot-muted">Start the Suite API or Ollama when they’re down. Output goes to log files.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">Free port 11434</h3>
                <p className="text-whynot-muted">Kill the process using port 11434 when Ollama shows “address already in use”.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">Get fix suggestions</h3>
                <p className="text-whynot-muted">Send full context to the selected model. Returns Problem → Suggestion. You choose what to run.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">Run fix</h3>
                <p className="text-whynot-muted">Run commands you approve: ollama, mix, npm, bash, sh. Choose file to pick a script.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">Edit file</h3>
                <p className="text-whynot-muted">Choose file → Read → edit → Write. Allowed: project root, ~/.config/ai-dev-suite. Not /tmp.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">▶ Test Chat</h3>
                <p className="text-whynot-muted">Send a test request to the Suite’s chat API. Checks if the Suite can respond. Helps spot “(no response)” or stream errors.</p>
              </div>
              <div>
                <h3 className="font-medium text-whynot-accent mb-1">🔍 Ask {selectedModel || 'model'}</h3>
                <p className="text-whynot-muted">Send context to the selected model for analysis and fix suggestions. Same model as Chat.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main ref={mainRef} className="flex-1 p-6 overflow-auto flex flex-col gap-4">
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200/90">
          <strong>Suggestions only.</strong> No fixes are applied automatically. You decide which to implement.
        </div>

        {observerOpen && (
          <div className="rounded-lg border border-whynot-border bg-[#0d1117] overflow-hidden">
            <div className="px-3 py-2 border-b border-whynot-border flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-whynot-body">Debug Observer</span>
                <span className="text-xs font-mono text-whynot-muted">
                  API:41434={health?.api ?? '?'} | Ollama:11434={health?.ollama ?? '?'} | Vite:5174={health?.vite ?? '?'}
                </span>
                <button
                  onClick={showMemory}
                  className="text-xs text-whynot-muted hover:text-whynot-accent"
                  title="Past fixes (RAG memory)"
                >
                  memory
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={runAnalysis}
                  disabled={analysisLoading}
                  className="px-3 py-1.5 rounded border border-whynot-border/50 text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/30 disabled:opacity-50 text-sm font-medium"
                  title="Ask model for suggestions"
                >
                  {analysisLoading ? '…' : '🔍 Ask'}
                </button>
                <button
                  onClick={runObserverCheck}
                  disabled={testLoading || analysisLoading}
                  className="px-3 py-1.5 rounded bg-whynot-accent/20 text-whynot-accent hover:bg-whynot-accent/30 disabled:opacity-50 text-sm font-medium"
                >
                  {testLoading || analysisLoading ? 'Running…' : '▶ Run check'}
                </button>
              </div>
            </div>
            {detectedProblems.length > 0 && (
              <div className="mx-3 mt-2 mb-0 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-red-200">
                  Problems: {detectedProblems.join(' · ')}
                </span>
                {(health?.api === 'down' || health?.api === '0') && (
                  <button
                    onClick={startApi}
                    disabled={startLoading !== null}
                    className="px-3 py-1.5 rounded bg-red-500/30 text-red-200 hover:bg-red-500/40 disabled:opacity-50 text-sm font-medium"
                  >
                    {startLoading === 'api' ? 'Starting…' : '▶ Start API'}
                  </button>
                )}
                {(health?.ollama === 'down' || health?.ollama === '0') && (
                  <button
                    onClick={startOllama}
                    disabled={startLoading !== null}
                    className="px-3 py-1.5 rounded bg-red-500/30 text-red-200 hover:bg-red-500/40 disabled:opacity-50 text-sm font-medium"
                  >
                    {startLoading === 'ollama' ? 'Starting…' : '▶ Start Ollama'}
                  </button>
                )}
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
            <pre className="p-3 text-xs font-mono text-whynot-muted overflow-auto min-h-40 max-h-[50vh] resize-y leading-relaxed m-0">
              {logsLoading ? 'Loading...' : [
                ...apiLog.slice(-25).map((l) => `[API]    ${l}`),
                ...ollamaLog.slice(-25).map((l) => `[OLLAMA] ${l}`),
              ].join('\n') || '[API] (no log)\n[OLLAMA] (no log)'}
            </pre>
            {(testOutput !== null || analysis !== null) && (
              <div className="border-t border-whynot-border p-3 space-y-2 bg-black/30">
                {testOutput !== null && (
                  <div>
                    <div className="text-[10px] uppercase text-whynot-muted/80 mb-1">Test chat</div>
                    <pre className="text-xs font-mono text-whynot-muted whitespace-pre-wrap m-0">{testOutput}</pre>
                  </div>
                )}
                {analysis !== null && (
                  <div>
                    <div className="text-[10px] uppercase text-green-400/80 mb-1">Suggestions</div>
                    <pre className="text-xs font-mono text-green-300/90 whitespace-pre-wrap m-0">{analysis}</pre>
                  </div>
                )}
              </div>
            )}
            <div className="rounded-lg border border-whynot-accent/30 bg-whynot-surface overflow-hidden flex flex-col mt-3" style={{ minHeight: 280 }}>
              <div className="px-3 py-2 border-b border-whynot-accent/30 flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-whynot-accent">Observer Chat</span>
                {ollamaModels.length > 0 && (
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="rounded border border-whynot-accent/40 bg-whynot-bg px-2 py-1 text-xs font-mono text-whynot-body focus:outline-none focus:ring-1 focus:ring-whynot-accent"
                  >
                    {ollamaModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                )}
                <div className="relative">
                  <button
                    onClick={() => { setDownloadOpen((o) => !o); if (!downloadOpen) fetchDownloadable(); }}
                    className="px-2 py-1 rounded text-xs text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/50"
                    title="Download model from Ollama"
                  >
                    ↓ Download
                  </button>
                  {downloadOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDownloadOpen(false)} />
                      <div className="absolute left-0 top-full mt-1 z-20 w-52 max-h-64 overflow-y-auto rounded border border-whynot-border bg-whynot-surface py-1 shadow-lg">
                        <div className="px-3 py-2 text-xs text-whynot-muted border-b border-whynot-border">Click to download</div>
                        {downloadableModels.map((m) => (
                          <button
                            key={m}
                            onClick={() => pullModel(m)}
                            disabled={!!pullLoading}
                            className={`block w-full text-left px-3 py-2 text-sm hover:bg-whynot-border/50 disabled:opacity-50 ${ollamaModels.includes(m) ? 'text-whynot-muted' : 'text-whynot-body'}`}
                          >
                            {pullLoading === m ? `${m}…` : ollamaModels.includes(m) ? `✓ ${m}` : m}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-1 overflow-auto p-3 space-y-3 min-h-0">
                {observerChatMessages.length === 0 && (
                  <p className="text-sm text-whynot-muted">Ask about logs, processes, or what to fix. Context is sent with each message.</p>
                )}
                {observerChatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-whynot-accent/20 text-whynot-body' : 'bg-whynot-border/30 text-whynot-body'}`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs text-whynot-muted">{m.role === 'user' ? 'You' : 'Debugger'}</span>
                        {m.role === 'assistant' && (
                          <button
                            onClick={async () => {
                              const prev = observerChatMessages[i - 1];
                              const issueSummary = prev?.role === 'user' ? prev.content.slice(0, 300) : 'Observer';
                              const r = await window.debugApi?.saveFix?.({ issueSummary, fix: m.content });
                              if (r?.ok) {
                                const mRes = await window.debugApi?.getMemory?.();
                                if (mRes && !mRes.error) setMemoryContent(mRes.content || '');
                              }
                            }}
                            className="text-[10px] text-whynot-muted hover:text-whynot-accent"
                            title="Save to RAG memory"
                          >
                            + memory
                          </button>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                ))}
                {observerChatLoading && <div className="text-sm text-whynot-muted">…</div>}
              </div>
              <div className="p-3 border-t border-whynot-border flex gap-2">
                <input
                  type="text"
                  value={observerChatInput}
                  onChange={(e) => setObserverChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendObserverChat())}
                  placeholder="Ask about logs, processes, or fixes..."
                  className="flex-1 rounded-lg border border-whynot-border bg-whynot-bg px-3 py-2 text-sm text-whynot-body placeholder:text-whynot-muted focus:outline-none focus:ring-1 focus:ring-whynot-accent"
                />
                <button
                  onClick={sendObserverChat}
                  disabled={observerChatLoading || !observerChatInput.trim()}
                  className="px-4 py-2 rounded-lg bg-whynot-accent/30 text-whynot-accent hover:bg-whynot-accent/40 disabled:opacity-50 text-sm font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

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
          <div ref={chatPanelRef} className="rounded-lg border border-whynot-accent/30 bg-whynot-surface overflow-hidden flex flex-col" style={{ minHeight: 280 }}>
            <div className="px-3 py-2 border-b border-whynot-accent/30 flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-whynot-accent">Chat with Debugger</span>
              {ollamaModels.length > 0 && (
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="rounded border border-whynot-accent/40 bg-whynot-bg px-2 py-1 text-xs font-mono text-whynot-body focus:outline-none focus:ring-1 focus:ring-whynot-accent"
                >
                  {ollamaModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
              <div className="relative">
                <button
                  onClick={() => { setDownloadOpen((o) => !o); if (!downloadOpen) fetchDownloadable(); }}
                  className="px-2 py-1 rounded text-xs text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/50"
                  title="Download model from Ollama"
                >
                  ↓ Download
                </button>
                {downloadOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDownloadOpen(false)} />
                    <div className="absolute left-0 top-full mt-1 z-20 w-52 max-h-64 overflow-y-auto rounded border border-whynot-border bg-whynot-surface py-1 shadow-lg">
                      <div className="px-3 py-2 text-xs text-whynot-muted border-b border-whynot-border">Click to download</div>
                      {downloadableModels.map((m) => (
                        <button
                          key={m}
                          onClick={() => pullModel(m)}
                          disabled={!!pullLoading}
                          className={`block w-full text-left px-3 py-2 text-sm hover:bg-whynot-border/50 disabled:opacity-50 ${ollamaModels.includes(m) ? 'text-whynot-muted' : 'text-whynot-body'}`}
                        >
                          {pullLoading === m ? `${m}…` : ollamaModels.includes(m) ? `✓ ${m}` : m}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-3 space-y-3 min-h-0">
              {chatMessages.length === 0 && (
                <p className="text-sm text-whynot-muted">Ask about logs, processes, or what to fix. Context is sent with each message.</p>
              )}
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-whynot-accent/20 text-whynot-body' : 'bg-whynot-border/30 text-whynot-body'}`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs text-whynot-muted">{m.role === 'user' ? 'You' : 'Debugger'}</span>
                      {m.role === 'assistant' && (
                        <button
                          onClick={async () => {
                            const prev = chatMessages[i - 1];
                            const issueSummary = prev?.role === 'user' ? prev.content.slice(0, 300) : 'Chat';
                            const r = await window.debugApi?.saveFix?.({ issueSummary, fix: m.content });
                            if (r?.ok) {
                              const mRes = await window.debugApi?.getMemory?.();
                              if (mRes && !mRes.error) setMemoryContent(mRes.content || '');
                            }
                          }}
                          className="text-[10px] text-whynot-muted hover:text-whynot-accent"
                          title="Save to RAG memory"
                        >
                          + memory
                        </button>
                      )}
                    </div>
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
                onClick={() => sendChat()}
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
              <div className="flex flex-col min-w-0">
                <div className="text-whynot-accent font-medium mb-1">Relevant processes (ollama, node, beam…)</div>
                <pre className="text-whynot-muted overflow-auto min-h-32 max-h-[70vh] resize-y whitespace-pre-wrap p-1 -m-1 rounded border border-transparent hover:border-whynot-border/50">{systemLoading ? 'Loading...' : processes?.relevant?.length ? processes.relevant.join('\n') : '(none)'}</pre>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-whynot-accent font-medium mb-1">Terminals</div>
                <pre className="text-whynot-muted overflow-auto min-h-32 max-h-[70vh] resize-y whitespace-pre-wrap p-1 -m-1 rounded border border-transparent hover:border-whynot-border/50">{systemLoading ? 'Loading...' : processes?.terminals?.length ? processes.terminals.join('\n') : '(none)'}</pre>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="text-whynot-accent font-medium mb-1">Config & project files</div>
                <pre className="text-whynot-muted overflow-auto min-h-32 max-h-[70vh] resize-y whitespace-pre-wrap p-1 -m-1 rounded border border-transparent hover:border-whynot-border/50">{systemLoading ? 'Loading...' : files ? [...files.configFiles, ...files.logFiles.map((l) => l.path), ...files.projectFiles].filter(Boolean).join('\n') || '(none)' : '(none)'}</pre>
              </div>
            </div>
          </div>
        )}

        {memoryOpen && (
          <div className="rounded-lg border border-whynot-accent/30 bg-whynot-accent/5 overflow-hidden">
            <div className="px-3 py-2 border-b border-whynot-accent/30 text-sm font-medium text-whynot-accent">Past fixes (RAG memory)</div>
            <pre className="p-3 text-xs font-mono text-whynot-muted overflow-auto min-h-48 max-h-[70vh] resize-y whitespace-pre-wrap">{memoryContent ?? 'Loading...'}</pre>
          </div>
        )}

        <div ref={logsSectionRef} className="flex-1 flex gap-4 min-h-0 resize-y overflow-hidden" style={{ minHeight: 240, maxHeight: '70vh' }}>
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
