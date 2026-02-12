import { useState, useRef, useEffect } from 'react';
import {
  getOllamaModels,
  getDownloadableModels,
  getKnowledgeBases,
  loadOllamaModel,
  pullModel,
  sendChatStream,
  startOllama,
  uploadToKnowledgeBase,
  askDebugger,
} from '../api';
import { useChat, type ModelOptions } from '../contexts/ChatContext';

export default function Chat() {
  const { chats, activeChatId, activeChat, createChat, switchChat, deleteChat, addMessage, appendToLastAssistantMessage, appendThinkingToLastAssistantMessage, setSelectedModel, setKnowledgeBases, toggleKnowledgeBase, setModelOptions, setChatTitle, toggleInternet, setChatFailed, setChatSucceeded } =
    useChat();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [kbPickerOpen, setKbPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messages = activeChat?.messages ?? [];
  const selectedModel = activeChat?.selectedModel ?? 'llama3.2:latest';
  const knowledgeBases = activeChat?.knowledgeBases ?? ['default'];
  const modelOptions = activeChat?.modelOptions;
  const internetEnabled = activeChat?.internetEnabled ?? false;
  const [models, setModels] = useState<string[]>([]);
  const [availableKbs, setAvailableKbs] = useState<string[]>(['default']);
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pullTarget, setPullTarget] = useState<string | null>(null);
  const [startingOllama, setStartingOllama] = useState(false);
  const [refreshSpinning, setRefreshSpinning] = useState(false);
  const [debugHelpOpen, setDebugHelpOpen] = useState(false);
  const [debugHelpLoading, setDebugHelpLoading] = useState(false);
  const [debugHelpResult, setDebugHelpResult] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const refreshModels = () => {
    getOllamaModels()
      .then((r) => {
        const m = r.models ?? [];
        setModels(m);
        setOllamaRunning(!r.error);
        if (m.length > 0 && !m.includes(selectedModel)) setSelectedModel(m[0]);
      })
      .catch(() => {
        setModels([]);
        setOllamaRunning(false);
      });
  };

  const refreshKbs = () => {
    getKnowledgeBases()
      .then((r) => setAvailableKbs(r.knowledge_bases ?? ['default']))
      .catch(() => setAvailableKbs(['default']));
  };

  useEffect(() => refreshModels(), []);
  useEffect(() => refreshKbs(), []);

  // Preload selected model when Chat is shown (so first message is fast)
  useEffect(() => {
    if (ollamaRunning && selectedModel) {
      loadOllamaModel(selectedModel).catch(() => {});
    }
  }, [selectedModel, ollamaRunning]);

  // Scroll to bottom when messages change or during streaming
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [messages, loading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  const handleAskDebugger = async (context?: string) => {
    setDebugHelpOpen(true);
    setDebugHelpLoading(true);
    setDebugHelpResult(null);
    try {
      const r = await askDebugger(undefined, context ?? (error || '(no response)'));
      if (r.ok && r.analysis) {
        setDebugHelpResult(r.analysis);
      } else {
        setDebugHelpResult(r.error ?? 'Debugger unavailable');
      }
    } catch (e) {
      setDebugHelpResult(String(e));
    } finally {
      setDebugHelpLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    addMessage({ role: 'user', content: text });
    setLoading(true);
    setError(null); // Clear stale error when retrying
    abortControllerRef.current = new AbortController();

    const msgs = [...messages, { role: 'user', content: text }].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    addMessage({ role: 'assistant', content: '', thinking: '' });

    let receivedContent = false;
    try {
      await sendChatStream(selectedModel, msgs, knowledgeBases, {
        onDelta: (delta) => {
          receivedContent = true;
          setChatSucceeded();
          appendToLastAssistantMessage(delta);
        },
        onThinking: (thinking) => {
          receivedContent = true;
          setChatSucceeded();
          appendThinkingToLastAssistantMessage(thinking);
        },
        onDone: () => {
          setLoading(false);
          abortControllerRef.current = null;
          if (receivedContent) {
            setError(null);
            setChatSucceeded();
          } else {
            setChatFailed();
          }
        },
        onError: (err) => {
          setError(err);
          setLoading(false);
          setChatFailed();
        },
      }, modelOptions, internetEnabled, abortControllerRef.current.signal);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handlePull = async (name: string) => {
    setPullTarget(name);
    setError(null);
    try {
      const res = await pullModel(name);
      if (res.error) setError(res.error);
      else refreshModels();
    } catch (e) {
      setError(String(e));
    } finally {
      setPullTarget(null);
    }
  };

  const handleStartOllama = async () => {
    setError(null);
    setStartingOllama(true);
    try {
      const res = await startOllama();
      if (res.error) setError(res.error);
      else setTimeout(refreshModels, 2500);
    } finally {
      setStartingOllama(false);
    }
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || uploadingDoc) return;
    setError(null);
    setUploadingDoc(true);
    try {
      const res = await uploadToKnowledgeBase(knowledgeBases[0] ?? 'default', file);
      if (res.error) setError(res.error);
      else setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="text-2xl font-semibold text-whynot-body shrink-0">Chat</h2>
          {activeChat && (
            <button
              onClick={() => setEditingChatId(activeChat.id)}
              className="px-2 py-1 rounded text-xs text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/30 shrink-0"
              title="Rename chat"
            >
              Rename
            </button>
          )}
          {chats.length >= 1 && (
            <div className="flex gap-1 overflow-x-auto flex-1 min-w-0">
              {chats.map((c) => (
                <div
                  key={c.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t text-sm cursor-pointer shrink-0 ${
                c.id === activeChatId
                  ? 'bg-whynot-surface border border-b-0 border-whynot-border text-whynot-body'
                  : 'bg-whynot-border/30 text-whynot-muted hover:text-whynot-body'
              }`}
                >
                  {editingChatId === c.id ? (
                    <input
                      type="text"
                      defaultValue={c.title}
                      autoFocus
                      className="w-24 px-1 py-0.5 rounded bg-whynot-bg border border-whynot-border text-whynot-body text-sm"
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v) setChatTitle(c.id, v);
                        setEditingChatId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = (e.target as HTMLInputElement).value.trim();
                          if (v) setChatTitle(c.id, v);
                          setEditingChatId(null);
                        }
                        if (e.key === 'Escape') setEditingChatId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <button
                      onClick={() => switchChat(c.id)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingChatId(c.id);
                      }}
                      className="text-left truncate max-w-[120px] flex items-center gap-1.5"
                      title={`Double-click to rename · KBs: ${(c.knowledgeBases ?? ['default']).join(', ')}`}
                    >
                      <span>{c.title}</span>
                      <span className="text-[10px] px-1 rounded bg-whynot-border/50 text-whynot-muted shrink-0 max-w-[80px] truncate" title={`Documents: ${(c.knowledgeBases ?? ['default']).join(', ')}`}>
                        {(c.knowledgeBases ?? ['default']).length > 1 ? `${(c.knowledgeBases ?? []).length} KBs` : (c.knowledgeBases ?? ['default'])[0] === 'default' ? 'default' : (c.knowledgeBases ?? [])[0]}
                      </span>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(c.id);
                    }}
                    className="text-whynot-muted hover:text-red-400 text-xs"
                    title="Close chat"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span
            className={`flex items-center gap-1.5 text-xs ${
              ollamaRunning === true ? 'text-green-500' : ollamaRunning === false ? 'text-red-400' : 'text-whynot-muted'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                ollamaRunning === true ? 'bg-green-500' : ollamaRunning === false ? 'bg-red-500' : 'bg-whynot-muted'
              }`}
            />
            {ollamaRunning === true ? 'Ollama running' : ollamaRunning === false ? 'Ollama not running' : '…'}
          </span>
          <button
            onClick={() => createChat()}
            className="px-3 py-1.5 rounded text-sm bg-whynot-accent/20 text-whynot-accent hover:bg-whynot-accent/30"
          >
            + New chat
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-4">
        <button
          onClick={() => {
            setRefreshSpinning(true);
            setTimeout(() => setRefreshSpinning(false), 400);
            ollamaRunning === false ? handleStartOllama() : refreshModels();
          }}
          disabled={ollamaRunning === false && startingOllama}
          className="px-3 py-1.5 rounded text-sm bg-whynot-accent/20 text-whynot-accent hover:bg-whynot-accent/30 disabled:opacity-50 inline-flex items-center gap-1"
          title={ollamaRunning === true ? 'Refresh model list' : 'Start Ollama'}
        >
          <span className={`inline-block ${refreshSpinning ? 'animate-spin-once' : ''}`}>
            ↻
          </span>
          {ollamaRunning === false && startingOllama ? 'Starting…' : 'Refresh'}
        </button>
        <span className="flex items-center gap-1 rounded border border-whynot-border bg-whynot-surface">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="px-3 py-2 bg-transparent border-0 text-whynot-body text-sm focus:ring-0 focus:outline-none"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
            {models.length === 0 && <option>No models</option>}
          </select>
          <PullModelDropdown onPull={handlePull} loading={pullTarget} />
        </span>
        <span className="relative flex items-center gap-1" title="Documents the AI sees. Connect multiple KBs per chat. Create KBs in Drive.">
          <button
            type="button"
            onClick={() => setKbPickerOpen((o) => !o)}
            className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm hover:bg-whynot-border/20"
          >
            KBs: {knowledgeBases.length > 1 ? `${knowledgeBases.length} selected` : knowledgeBases[0] === 'default' ? 'default' : knowledgeBases[0]}
          </button>
          {kbPickerOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                aria-hidden
                onClick={() => setKbPickerOpen(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-20 py-2 px-2 rounded border border-whynot-border bg-whynot-surface shadow-lg min-w-[160px]">
                <div className="text-xs text-whynot-muted mb-2 px-1">Select KBs for this chat:</div>
                {availableKbs.map((kb) => (
                  <label
                    key={kb}
                    className="flex items-center gap-2 py-1 px-2 rounded hover:bg-whynot-border/20 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={knowledgeBases.includes(kb)}
                      onChange={() => toggleKnowledgeBase(kb)}
                    />
                    <span>{kb === 'default' ? 'default (drive · general)' : kb}</span>
                  </label>
                ))}
                {knowledgeBases.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setKnowledgeBases(['default'])}
                    className="text-xs text-whynot-accent mt-1"
                  >
                    Use default
                  </button>
                )}
              </div>
            </>
          )}
        </span>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/20"
          title="Model settings (temperature, tokens, etc.)"
        >
          ⚙
        </button>
      </div>

      {settingsOpen && (
        <ChatSettingsModal
          options={modelOptions}
          onSave={(opts) => {
            setModelOptions(opts);
            setSettingsOpen(false);
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {error && (
        <div className="mb-2 p-2 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-sm flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {error}
            {(error.includes('fetch') || error.includes('Failed') || error.includes('network') || error.includes('Cannot reach API')) && (
              <div className="mt-1 text-xs text-whynot-muted">
                API running? Run: <code>./start-ai-dev-suite-api.sh</code> in another terminal
              </div>
            )}
          </div>
          <button type="button" onClick={() => handleAskDebugger(error)} className="shrink-0 px-2 py-1 rounded text-xs bg-whynot-accent/20 text-whynot-accent hover:bg-whynot-accent/30" title="Ask debugger for fix suggestions">Debug help</button>
          <button type="button" onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-300" aria-label="Dismiss">×</button>
        </div>
      )}

      {debugHelpOpen && (
        <div className="mb-2 p-3 rounded border border-whynot-border bg-whynot-surface">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-whynot-body">Debugger suggestions</span>
            <button type="button" onClick={() => setDebugHelpOpen(false)} className="text-whynot-muted hover:text-whynot-body">×</button>
          </div>
          {debugHelpLoading ? (
            <p className="text-sm text-whynot-muted">Asking debugger…</p>
          ) : debugHelpResult ? (
            <>
              <pre className="text-xs text-whynot-body whitespace-pre-wrap font-sans mb-2">{debugHelpResult}</pre>
              <a href="http://localhost:5175" target="_blank" rel="noopener noreferrer" className="text-xs text-whynot-accent hover:underline">
                Open debugger to run fixes →
              </a>
            </>
          ) : null}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto space-y-4 mb-4 p-2 rounded border border-whynot-border bg-whynot-surface min-h-[200px]"
      >
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded text-sm ${
                m.role === 'user' ? 'bg-whynot-accent/30 text-whynot-body' : 'bg-whynot-border/30 text-whynot-body'
              }`}
            >
              {m.role === 'assistant' && (m.thinking ?? '') && (
                <div className="mb-2 pb-2 border-b border-whynot-border/50">
                  <div className="text-[10px] uppercase tracking-wide text-whynot-muted mb-1">Thinking</div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-whynot-muted">
                    {m.thinking}
                    {loading && i === messages.length - 1 && (
                      <span className="inline-block w-2 h-3 ml-0.5 bg-whynot-muted animate-pulse align-middle" aria-hidden />
                    )}
                  </pre>
                </div>
              )}
              <pre className="whitespace-pre-wrap font-sans">
                {m.content || (loading && i === messages.length - 1 && !(m.thinking ?? '') ? '…' : '')}
                {loading && i === messages.length - 1 && m.role === 'assistant' && !(m.thinking ?? '') && (
                  <>
                    <span className="inline-block w-2 h-4 ml-0.5 bg-whynot-accent animate-pulse align-middle" aria-hidden title="Waiting for response…" />
                    <span className="ml-1 text-xs text-whynot-muted">(first load can take 1–2 min)</span>
                  </>
                )}
                {!loading && m.role === 'assistant' && !m.content && !(m.thinking ?? '') && (
                  <NoResponseDebug
                    onTryDefaultKb={() => setKnowledgeBases(['default'])}
                    onAskDebugger={() => handleAskDebugger('Chat returned (no response)')}
                    currentKb={knowledgeBases}
                  />
                )}
              </pre>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.markdown,.pdf,.docx,.rst,.tex"
          className="hidden"
          onChange={handleUploadDocument}
        />
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={internetEnabled
            ? 'Message… (web search ON – URLs will be fetched)'
            : 'Message… /memory /remember /drive /research /bye'}
          rows={1}
          className="flex-1 px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body placeholder-whynot-muted text-sm resize-none min-h-[2.5rem] max-h-40 overflow-y-auto"
        />
        <button
          onClick={() => toggleInternet()}
          className={`px-3 py-2 rounded border text-sm shrink-0 ${
            internetEnabled
              ? 'border-whynot-accent bg-whynot-accent/20 text-whynot-accent'
              : 'border-whynot-border bg-whynot-surface text-whynot-body hover:bg-whynot-border/30'
          }`}
          title={internetEnabled ? 'Web search enabled for this message' : 'Enable web search for AI responses'}
        >
          Internet
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingDoc}
          className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm hover:bg-whynot-border/30 disabled:opacity-50"
          title="Upload document to knowledge base"
        >
          {uploadingDoc ? 'Uploading…' : 'Upload'}
        </button>
        <button
          onClick={loading ? handleStop : handleSend}
          disabled={!loading && !input.trim()}
          className={`px-4 py-2 rounded text-sm font-medium ${
            loading
              ? 'bg-whynot-muted text-whynot-body hover:bg-whynot-border'
              : 'bg-whynot-accent text-white hover:opacity-90 disabled:opacity-50'
          }`}
        >
          {loading ? 'Stop' : 'Send'}
        </button>
      </div>
      <a
        href="https://github.com/zerwiz/setup"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block text-xs text-whynot-muted hover:text-whynot-link transition-colors"
      >
        github.com/zerwiz/setup
      </a>
    </div>
  );
}

const DEBUG_STEPS = [
  'Click "Get debug help" above for debugger fix suggestions',
  'Try KB: default — large KB can cause empty replies',
  'First model load can take 1–2 min; wait and retry',
  'Ollama running? Click ↻ Refresh',
  'Run app from terminal to see API logs',
  'Port 41434 free? Kill other API instances',
  'curl -s http://localhost:41434/api/ollama/models',
  'curl -s http://localhost:11434/api/tags',
  'ollama list — model exists?',
  'ollama run MODEL hello — direct test',
  'mix deps.get && mix compile in elixir_tui',
  'Firewall/VPN blocking localhost?',
  'Model too large? Try smaller model (14B needs 1–2 min first load)',
];

function NoResponseDebug({
  onTryDefaultKb,
  onAskDebugger,
  currentKb = ['default'],
}: {
  onTryDefaultKb?: () => void;
  onAskDebugger?: () => void;
  currentKb?: string[];
}) {
  const [open, setOpen] = useState(false);
  const isDefaultKb = currentKb.length === 1 && currentKb[0] === 'default';
  return (
    <div className="text-whynot-muted">
      <span className="italic">(no response)</span>{' '}
      {onAskDebugger && (
        <button type="button" onClick={onAskDebugger} className="text-xs text-whynot-accent hover:underline mr-1" title="Ask debugger for fix suggestions">
          Get debug help
        </button>
      )}
      {!isDefaultKb && onTryDefaultKb && (
        <button
          type="button"
          onClick={onTryDefaultKb}
          className="text-xs text-whynot-accent hover:underline mr-1"
        >
          Try default KB
        </button>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-whynot-accent hover:underline"
      >
        {open ? 'hide debug' : 'debug'}
      </button>
      {open && (
        <ul className="mt-2 text-xs space-y-1 list-disc list-inside text-whynot-muted max-w-md">
          {DEBUG_STEPS.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-whynot-muted mb-1">
        {label} {unit != null && `(${unit})`}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1"
        />
        <span className="text-sm text-whynot-body w-14">{value}</span>
      </div>
    </div>
  );
}

function NumRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-whynot-muted mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Math.max(min, Math.min(max, parseInt(e.target.value, 10) || min)))}
        className="w-full px-3 py-2 rounded border border-whynot-border bg-whynot-bg text-whynot-body text-sm"
        placeholder={hint}
      />
    </div>
  );
}

const PRESETS_STORAGE_KEY = 'zerwiz-ai-dev-suite-model-presets';

type ModelOptionsPreset = { id: string; name: string; options: ModelOptions };

function loadPresets(): ModelOptionsPreset[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PRESETS_STORAGE_KEY) : null;
    if (!raw) return [];
    const data = JSON.parse(raw) as ModelOptionsPreset[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function savePresets(presets: ModelOptionsPreset[]) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    }
  } catch {
    /* ignore */
  }
}

function ChatSettingsModal({
  options,
  onSave,
  onClose,
}: {
  options?: ModelOptions;
  onSave: (opts: ModelOptions | undefined) => void;
  onClose: () => void;
}) {
  const hasOptions = options !== undefined && Object.keys(options).length > 0;
  const [useCustom, setUseCustom] = useState(hasOptions);
  const [presets, setPresets] = useState<ModelOptionsPreset[]>(() => loadPresets());
  const [temp, setTemp] = useState(options?.temperature ?? 0.7);
  const [numPredict, setNumPredict] = useState(options?.num_predict ?? 2048);
  const [numCtx, setNumCtx] = useState(options?.num_ctx ?? 4096);
  const [topP, setTopP] = useState(options?.top_p ?? 0.9);
  const [topK, setTopK] = useState(options?.top_k ?? 40);
  const [repeatPenalty, setRepeatPenalty] = useState(options?.repeat_penalty ?? 1.1);
  const [repeatLastN, setRepeatLastN] = useState(options?.repeat_last_n ?? 64);
  const [seed, setSeed] = useState(options?.seed ?? 0);
  const [stopStr, setStopStr] = useState((options?.stop ?? []).join(', '));

  const applyPresetToForm = (opts: ModelOptions) => {
    setUseCustom(true);
    setTemp(opts.temperature ?? 0.7);
    setNumPredict(opts.num_predict ?? 2048);
    setNumCtx(opts.num_ctx ?? 4096);
    setTopP(opts.top_p ?? 0.9);
    setTopK(opts.top_k ?? 40);
    setRepeatPenalty(opts.repeat_penalty ?? 1.1);
    setRepeatLastN(opts.repeat_last_n ?? 64);
    setSeed(opts.seed ?? 0);
    setStopStr((opts.stop ?? []).join(', '));
  };

  const getFormOptions = (): ModelOptions => {
    const stop = stopStr.trim() ? stopStr.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    return {
      temperature: temp,
      num_predict: numPredict,
      num_ctx: numCtx,
      top_p: topP,
      top_k: topK,
      repeat_penalty: repeatPenalty,
      repeat_last_n: repeatLastN,
      seed: seed > 0 ? seed : undefined,
      stop,
    };
  };

  useEffect(() => {
    if (options) {
      setTemp(options.temperature ?? 0.7);
      setNumPredict(options.num_predict ?? 2048);
      setNumCtx(options.num_ctx ?? 4096);
      setTopP(options.top_p ?? 0.9);
      setTopK(options.top_k ?? 40);
      setRepeatPenalty(options.repeat_penalty ?? 1.1);
      setRepeatLastN(options.repeat_last_n ?? 64);
      setSeed(options.seed ?? 0);
      setStopStr((options.stop ?? []).join(', '));
    }
  }, [options]);

  const handleSaveAsPreset = () => {
    const name = prompt('Preset name');
    if (!name?.trim()) return;
    const opts = getFormOptions();
    const preset: ModelOptionsPreset = {
      id: 'preset-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      name: name.trim(),
      options: opts,
    };
    const next = [...presets, preset];
    setPresets(next);
    savePresets(next);
  };

  const handleDeletePreset = (id: string) => {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    savePresets(next);
  };

  const handleSave = () => {
    if (!useCustom) {
      onSave(undefined);
      return;
    }
    onSave(getFormOptions());
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg max-h-[90vh] flex flex-col rounded-lg border border-whynot-border bg-whynot-surface shadow-xl">
        <div className="p-4 border-b border-whynot-border shrink-0">
          <h3 className="text-lg font-medium text-whynot-body">Model settings</h3>
          <p className="text-xs text-whynot-muted mt-1">
            Ollama parameters for this chat. Leave default for model defaults.
          </p>
        </div>
        <div className="px-4 py-3 border-b border-whynot-border shrink-0 space-y-2">
          <div className="text-xs text-whynot-muted font-medium">Saved presets</div>
          {presets.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-whynot-border bg-whynot-bg text-sm"
                >
                  <button
                    type="button"
                    onClick={() => applyPresetToForm(p.options)}
                    className="text-whynot-accent hover:underline"
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePreset(p.id)}
                    className="text-whynot-muted hover:text-red-400 text-xs"
                    title="Delete preset"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-whynot-muted">No saved presets yet</p>
          )}
        </div>
        <label className="flex items-center gap-2 px-4 py-2 border-b border-whynot-border cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={useCustom}
            onChange={(e) => setUseCustom(e.target.checked)}
          />
          <span className="text-sm text-whynot-body">Use custom settings</span>
        </label>
        {useCustom && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SliderRow
                label="Temperature"
                value={temp}
                min={0}
                max={2}
                step={0.1}
                onChange={setTemp}
                unit="0–2"
              />
              <SliderRow
                label="Top P"
                value={topP}
                min={0}
                max={1}
                step={0.05}
                onChange={setTopP}
                unit="0–1"
              />
              <NumRow
                label="Max tokens"
                value={numPredict}
                min={64}
                max={131072}
                step={64}
                onChange={setNumPredict}
                hint="2048"
              />
              <NumRow
                label="Context window (num_ctx)"
                value={numCtx}
                min={512}
                max={131072}
                step={512}
                onChange={setNumCtx}
                hint="4096"
              />
              <NumRow
                label="Top K"
                value={topK}
                min={1}
                max={100}
                onChange={setTopK}
                hint="40"
              />
              <NumRow
                label="Repeat penalty"
                value={repeatPenalty}
                min={1}
                max={2}
                step={0.05}
                onChange={setRepeatPenalty}
                hint="1.1"
              />
              <NumRow
                label="Repeat last N"
                value={repeatLastN}
                min={0}
                max={512}
                onChange={setRepeatLastN}
                hint="64"
              />
              <NumRow
                label="Seed"
                value={seed}
                min={-1}
                max={2147483647}
                onChange={setSeed}
                hint="0 = random"
              />
            </div>
            <div>
              <label className="block text-xs text-whynot-muted mb-1">
                Stop sequences (comma-separated)
              </label>
              <input
                type="text"
                value={stopStr}
                onChange={(e) => setStopStr(e.target.value)}
                placeholder="e.g. \n\n, END, [DONE]"
                className="w-full px-3 py-2 rounded border border-whynot-border bg-whynot-bg text-whynot-body text-sm placeholder-whynot-muted"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveAsPreset}
                className="px-3 py-2 rounded border border-whynot-border text-whynot-muted hover:text-whynot-body text-sm"
              >
                Save as preset
              </button>
            </div>
          </div>
        )}
        <div className="flex gap-2 justify-end p-4 border-t border-whynot-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded border border-whynot-border text-whynot-muted hover:text-whynot-body text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded bg-whynot-accent text-white text-sm font-medium hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}

function PullModelDropdown({ onPull, loading }: { onPull: (name: string) => void; loading: string | null }) {
  const [open, setOpen] = useState(false);
  const [downloadable, setDownloadable] = useState<string[]>([]);

  useEffect(() => {
    if (open) getDownloadableModels().then((r) => setDownloadable(r.models ?? []));
  }, [open]);

  return (
    <div className="relative border-l border-whynot-border">
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-2 text-whynot-body text-sm hover:bg-whynot-border/30 whitespace-nowrap"
        title="Download model"
      >
        ↓ Download
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 w-48 max-h-48 overflow-y-auto rounded border border-whynot-border bg-whynot-surface py-1">
            {downloadable.map((m) => (
              <button
                key={m}
                onClick={() => {
                  onPull(m);
                  setOpen(false);
                }}
                disabled={!!loading}
                className="block w-full text-left px-3 py-2 text-sm text-whynot-body hover:bg-whynot-border/50 disabled:opacity-50"
              >
                {loading === m ? `${m}…` : m}
              </button>
            ))}
            {downloadable.length === 0 && <div className="px-3 py-2 text-sm text-whynot-muted">No models</div>}
          </div>
        </>
      )}
    </div>
  );
}
