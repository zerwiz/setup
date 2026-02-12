import { useState, useRef, useEffect } from 'react';
import {
  getOllamaModels,
  getDownloadableModels,
  getKnowledgeBases,
  pullModel,
  sendChat,
  startOllama,
  uploadToKnowledgeBase,
  type ChatReply,
} from '../api';
import { useChat } from '../contexts/ChatContext';

export default function Chat() {
  const { chats, activeChatId, activeChat, createChat, switchChat, deleteChat, addMessage, setSelectedModel, setKnowledgeBase, setChatTitle } =
    useChat();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const messages = activeChat?.messages ?? [];
  const selectedModel = activeChat?.selectedModel ?? 'llama3.2:latest';
  const knowledgeBase = activeChat?.knowledgeBase ?? 'default';
  const [models, setModels] = useState<string[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>(['default']);
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pullTarget, setPullTarget] = useState<string | null>(null);
  const [startingOllama, setStartingOllama] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      .then((r) => setKnowledgeBases(r.knowledge_bases ?? ['default']))
      .catch(() => setKnowledgeBases(['default']));
  };

  useEffect(() => refreshModels(), []);
  useEffect(() => refreshKbs(), []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    addMessage({ role: 'user', content: text });
    setLoading(true);
    setError(null);

    const msgs = [...messages, { role: 'user', content: text }].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res: ChatReply = await sendChat(selectedModel, msgs, knowledgeBase);
      if (res.reply) {
        addMessage({ role: 'assistant', content: res.reply });
      } else if (res.error) {
        setError(res.error);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
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
      const res = await uploadToKnowledgeBase(knowledgeBase, file);
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold text-whynot-body">Chat</h2>
          {activeChat && (
            <button
              onClick={() => setEditingChatId(activeChat.id)}
              className="px-2 py-1 rounded text-xs text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/30"
              title="Rename chat"
            >
              Rename
            </button>
          )}
        </div>
        <button
          onClick={() => createChat()}
          className="px-3 py-1.5 rounded text-sm bg-whynot-accent/20 text-whynot-accent hover:bg-whynot-accent/30"
        >
          + New chat
        </button>
      </div>

      {chats.length >= 1 && (
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
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
                  className="text-left truncate max-w-[120px]"
                  title="Double-click to rename"
                >
                  {c.title}
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

      <div className="flex flex-wrap gap-2 items-center mb-4">
        <span
          className={`flex items-center gap-1.5 text-sm ${
            ollamaRunning === true
              ? 'text-green-500'
              : ollamaRunning === false
                ? 'text-red-400'
                : 'text-whynot-muted'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              ollamaRunning === true ? 'bg-green-500' : ollamaRunning === false ? 'bg-red-500' : 'bg-whynot-muted'
            }`}
          />
          {ollamaRunning === true ? 'Ollama running' : ollamaRunning === false ? 'Ollama not running' : '…'}
        </span>
        <button
          onClick={ollamaRunning === false ? handleStartOllama : refreshModels}
          disabled={ollamaRunning === false && startingOllama}
          className="px-3 py-1.5 rounded text-sm bg-whynot-accent/20 text-whynot-accent hover:bg-whynot-accent/30 disabled:opacity-50"
          title={ollamaRunning === true ? 'Refresh model list' : 'Start Ollama'}
        >
          {ollamaRunning === false ? (startingOllama ? 'Starting…' : 'Start Ollama') : 'Refresh'}
        </button>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm"
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          {models.length === 0 && <option>No models</option>}
        </select>
        <select
          value={knowledgeBase}
          onChange={(e) => setKnowledgeBase(e.target.value)}
          className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm"
          title="Knowledge base for this chat"
        >
          {knowledgeBases.map((kb) => (
            <option key={kb} value={kb}>
              KB: {kb}
            </option>
          ))}
        </select>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.markdown,.pdf,.docx,.rst,.tex"
          className="hidden"
          onChange={handleUploadDocument}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingDoc}
          className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm hover:bg-whynot-border/30 disabled:opacity-50"
          title="Upload document to knowledge base for AI context"
        >
          {uploadingDoc ? 'Uploading…' : 'Upload doc'}
        </button>
        <PullModelDropdown onPull={handlePull} loading={pullTarget} />
      </div>

      {error && (
        <div className="mb-2 p-2 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-sm">
          {error}
          {(error.includes('fetch') || error.includes('Failed')) && (
            <div className="mt-1 text-xs text-whynot-muted">
              API running? Run: <code>./start-ai-dev-suite-api.sh</code> in another terminal
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2 rounded border border-whynot-border bg-whynot-surface min-h-[200px]">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded text-sm ${
                m.role === 'user' ? 'bg-whynot-accent/30 text-whynot-body' : 'bg-whynot-border/30 text-whynot-body'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded text-whynot-muted text-sm">…</div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Message… /memory /remember /drive /research /bye"
          className="flex-1 px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body placeholder-whynot-muted text-sm"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-4 py-2 rounded bg-whynot-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}

function PullModelDropdown({ onPull, loading }: { onPull: (name: string) => void; loading: string | null }) {
  const [open, setOpen] = useState(false);
  const [downloadable, setDownloadable] = useState<string[]>([]);

  useEffect(() => {
    if (open) getDownloadableModels().then((r) => setDownloadable(r.models ?? []));
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm"
      >
        Download model
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
