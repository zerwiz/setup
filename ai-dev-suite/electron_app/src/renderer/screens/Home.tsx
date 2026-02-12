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
    { to: '/settings', label: 'Settings', desc: 'Config and paths' },
  ];

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold text-whynot-body mb-6">Dashboard</h2>

      {loading ? (
        <p className="text-whynot-muted">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {cards.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="block p-6 rounded-lg border border-whynot-border bg-whynot-surface hover:border-whynot-accent transition-colors"
            >
              <h3 className="text-lg font-medium text-whynot-body mb-1">{c.label}</h3>
              <p className="text-sm text-whynot-muted">{c.desc}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-whynot-border bg-whynot-surface p-4">
        <h3 className="text-sm font-medium text-whynot-muted mb-2">Status</h3>
        <ul className="text-sm space-y-1">
          <li className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                ollamaRunning === true ? 'bg-green-500' : ollamaRunning === false ? 'bg-red-500' : 'bg-whynot-muted'
              }`}
            />
            Ollama: {ollamaRunning === true ? 'Running' : ollamaRunning === false ? 'Not running' : '…'}
            {models.length > 0 && <span className="text-whynot-muted">– {models.join(', ')}</span>}
          </li>
          <li>
            Config: <code className="text-whynot-link font-mono text-xs">{configDir || '–'}</code>
          </li>
        </ul>
      </div>
    </div>
  );
}
