import { useEffect, useState } from 'react';
import { getOllamaModels, startOllama } from '../api';
import { useChat } from '../contexts/ChatContext';

type Status = 'checking' | 'running' | 'stopped' | 'api-down';

export default function OllamaStatus() {
  const { lastChatFailed } = useChat();
  const [status, setStatus] = useState<Status>('checking');
  const [refreshSpinning, setRefreshSpinning] = useState(false);

  const check = () => {
    getOllamaModels()
      .then((r) => {
        if (r.error) {
          setStatus(r.error.toLowerCase().includes('fetch') ? 'api-down' : 'stopped');
        } else {
          setStatus('running');
        }
      })
      .catch(() => setStatus('api-down'));
  };

  useEffect(() => {
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  const handleStart = async () => {
    setStatus('checking');
    const r = await startOllama();
    setTimeout(check, 2000);
  };

  if (status === 'checking') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-whynot-muted">
        <span className="w-2 h-2 rounded-full bg-whynot-muted animate-pulse" />
        Ollama…
      </span>
    );
  }

  if (status === 'api-down') {
    return (
      <span className="flex items-center gap-1.5 text-sm text-whynot-muted" title="API unreachable">
        <span className="w-2 h-2 rounded-full bg-whynot-muted" />
        API
      </span>
    );
  }

  if (status === 'stopped') {
    return (
      <span className="flex items-center gap-1.5 text-sm">
        <span className="w-2 h-2 rounded-full bg-red-500" title="Ollama not running" />
        <span className="text-whynot-muted">Ollama</span>
        <button
          onClick={handleStart}
          className="px-2 py-0.5 rounded text-xs bg-whynot-accent/20 text-whynot-accent hover:bg-whynot-accent/30"
        >
          Start Ollama
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-sm">
      <span
        className={`w-2 h-2 rounded-full shrink-0 ${lastChatFailed ? 'bg-amber-500' : 'bg-green-500'}`}
        title={lastChatFailed ? 'Ollama reachable but chat is failing' : 'Ollama running'}
      />
      <span className="text-whynot-muted">
        {lastChatFailed ? 'Ollama – chat failing' : 'Ollama'}
      </span>
      <button
        onClick={() => {
          setRefreshSpinning(true);
          setTimeout(() => setRefreshSpinning(false), 400);
          check();
        }}
        className="px-2 py-0.5 rounded text-xs text-whynot-muted hover:text-whynot-body hover:bg-whynot-border/30"
        title="Refresh status"
      >
        <span className={`inline-block ${refreshSpinning ? 'animate-spin-once' : ''}`}>
          ↻
        </span>
      </button>
    </span>
  );
}
