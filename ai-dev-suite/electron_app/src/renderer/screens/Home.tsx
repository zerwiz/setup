import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOllamaModels, getConfig } from '../api';

export default function Home() {
  const [models, setModels] = useState<string[]>([]);
  const [ollamaRunning, setOllamaRunning] = useState<boolean | null>(null);
  const [configDir, setConfigDir] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getOllamaModels()
        .then((r) => {
          setModels(r.models ?? []);
          setOllamaRunning(!r.error);
        })
        .catch(() => {
          setModels([]);
          setOllamaRunning(false);
        }),
      getConfig().then((r) => setConfigDir(r.config_dir ?? '')).catch(() => setConfigDir('')),
    ]).finally(() => setLoading(false));
  }, []);

  const cards = [
    { to: '/tools', label: 'Install Tools', desc: 'Zed, Ollama, RAG, and more' },
    { to: '/chat', label: 'Chat', desc: 'Talk to your AI model' },
    { to: '/drive', label: 'Drive', desc: 'Add files and folders' },
    { to: '/memory', label: 'Memory', desc: 'Behavior, manual and conversation memory' },
    { to: '/settings', label: 'Settings', desc: 'Config and paths' },
  ];

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-whynot-body mb-2">Dashboard</h2>
        <p className="text-whynot-muted text-sm">
          Zerwiz AI Dev Suite – local AI tools, chat with documents, memory, and more.
        </p>
      </div>

      <section className="mb-8">
        <h3 className="text-sm font-medium text-whynot-muted uppercase tracking-wider mb-4">Overview</h3>
        {loading ? (
          <p className="text-whynot-muted">Loading...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((c) => (
              <Link
                key={c.to}
                to={c.to}
                className="block p-5 rounded-lg border border-whynot-border bg-whynot-surface hover:border-whynot-accent hover:bg-whynot-surface/80 transition-colors"
              >
                <h4 className="text-base font-medium text-whynot-body mb-1">{c.label}</h4>
                <p className="text-sm text-whynot-muted">{c.desc}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-medium text-whynot-muted uppercase tracking-wider mb-3">Status</h3>
        <div className="rounded-lg border border-whynot-border bg-whynot-surface p-4">
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  ollamaRunning === true ? 'bg-green-500' : ollamaRunning === false ? 'bg-red-500' : 'bg-whynot-muted'
                }`}
              />
              <span className="text-whynot-body">
                Ollama: {ollamaRunning === true ? 'Running' : ollamaRunning === false ? 'Not running' : '…'}
              </span>
              {models.length > 0 && (
                <span className="text-whynot-muted">– {models.join(', ')}</span>
              )}
            </div>
            <div className="text-whynot-muted">
              Config: <code className="text-whynot-body font-mono text-xs">{configDir || '–'}</code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
