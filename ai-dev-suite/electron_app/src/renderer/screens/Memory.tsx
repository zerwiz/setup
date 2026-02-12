import { useEffect, useState } from 'react';
import { getMemory, getMemoryModels, remember } from '../api';

export default function Memory() {
  const [content, setContent] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [modelInput, setModelInput] = useState('llama3.2:latest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    getMemory().then((r) => setContent(r.content ?? '')).catch(() => setContent(''));
    getMemoryModels().then((r) => setModels(r.models ?? [])).catch(() => setModels([]));
  };

  useEffect(() => load(), []);

  const handleRemember = async () => {
    const text = textInput.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    try {
      await remember(text, modelInput);
      setTextInput('');
      load();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold text-whynot-body mb-6">Memory</h2>
      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-sm">{error}</div>
      )}

      <div className="mb-6 rounded-lg border border-whynot-border bg-whynot-surface p-4">
        <h3 className="text-sm font-medium text-whynot-muted mb-2">Models in memory</h3>
        <p className="text-sm text-whynot-body">{models.length > 0 ? models.join(', ') : '(none)'}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-whynot-muted mb-2">Add to memory</h3>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Remember…"
            className="flex-1 min-w-[200px] px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body placeholder-whynot-muted text-sm"
          />
          <input
            type="text"
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            placeholder="Model"
            className="w-28 px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm"
          />
          <button
            onClick={handleRemember}
            disabled={loading}
            className="px-4 py-2 rounded bg-whynot-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-whynot-border bg-whynot-surface p-4">
        <h3 className="text-sm font-medium text-whynot-muted mb-2">Memory content</h3>
        <pre className="text-sm text-whynot-body font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
          {content || '(empty)'}
        </pre>
      </div>
    </div>
  );
}
