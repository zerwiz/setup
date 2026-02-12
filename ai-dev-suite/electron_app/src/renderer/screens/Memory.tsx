import { useEffect, useState } from 'react';
import { getMemory, getMemoryModels, remember, writeMemoryManual, writeMemoryConv } from '../api';

const CONV_SEP = '\n\n--- Conversation memory ---\n\n';

export default function Memory() {
  const [content, setContent] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [modelInput, setModelInput] = useState('llama3.2:latest');
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    getMemory().then((r) => setContent(r.content ?? '')).catch(() => setContent(''));
    getMemoryModels().then((r) => setModels(r.models ?? [])).catch(() => setModels([]));
  };

  useEffect(() => load(), []);

  const handleSave = async () => {
    setSaveLoading(true);
    setError(null);
    try {
      const idx = content.indexOf(CONV_SEP);
      const manual = idx >= 0 ? content.slice(0, idx).trim() : content.trim();
      const conv = idx >= 0 ? content.slice(idx + CONV_SEP.length).trim() : '';
      await writeMemoryManual(manual);
      await writeMemoryConv(conv);
      load();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaveLoading(false);
    }
  };

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
        <div className="flex items-center justify-between gap-4 mb-2">
          <h3 className="text-sm font-medium text-whynot-muted">Memory content</h3>
          <button
            onClick={handleSave}
            disabled={saveLoading}
            className="px-4 py-2 rounded bg-whynot-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
          >
            {saveLoading ? 'Saving…' : 'Save'}
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="(empty) – Add notes manually or use Add to memory above."
          className="w-full min-h-[200px] max-h-96 p-3 rounded border border-whynot-border bg-whynot-bg text-whynot-body font-mono text-sm whitespace-pre-wrap resize-y focus:outline-none focus:ring-2 focus:ring-whynot-accent/50 focus:border-whynot-accent"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
