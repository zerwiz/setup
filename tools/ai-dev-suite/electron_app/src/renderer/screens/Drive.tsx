import { useEffect, useState } from 'react';
import {
  getKnowledgeBases,
  getKnowledgeBaseContents,
  createKnowledgeBase,
  addToKnowledgeBase,
} from '../api';

export default function Drive() {
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>(['default']);
  const [selectedKb, setSelectedKb] = useState<string>('default');
  const [items, setItems] = useState<string[]>([]);
  const [pathInput, setPathInput] = useState('');
  const [newKbName, setNewKbName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKbs = () => {
    getKnowledgeBases()
      .then((r) => {
        const kbs = r.knowledge_bases ?? ['default'];
        setKnowledgeBases(kbs);
        if (!kbs.includes(selectedKb)) setSelectedKb(kbs[0] ?? 'default');
      })
      .catch(() => setKnowledgeBases(['default']));
  };

  const loadContents = () => {
    getKnowledgeBaseContents(selectedKb)
      .then((r) => setItems(r.items ?? []))
      .catch(() => setItems([]));
  };

  useEffect(() => loadKbs(), []);
  useEffect(() => loadContents(), [selectedKb]);

  const handleAdd = async () => {
    const path = pathInput.trim();
    if (!path || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await addToKnowledgeBase(selectedKb, path);
      if (res.error) setError(res.error);
      else {
        setPathInput('');
        loadContents();
        loadKbs();
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKb = async () => {
    const name = newKbName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!name || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await createKnowledgeBase(name);
      if (res.error) setError(res.error);
      else {
        setNewKbName('');
        loadKbs();
        setSelectedKb(name);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold text-whynot-body mb-6">Drive & Knowledge bases</h2>
      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-sm">{error}</div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-xs text-whynot-muted mb-1">Knowledge base</label>
          <select
            value={selectedKb}
            onChange={(e) => setSelectedKb(e.target.value)}
            className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm"
          >
            {knowledgeBases.map((kb) => (
              <option key={kb} value={kb}>
                {kb}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 items-end">
          <input
            type="text"
            value={newKbName}
            onChange={(e) => setNewKbName(e.target.value)}
            placeholder="New KB name"
            className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body placeholder-whynot-muted text-sm w-40"
          />
          <button
            onClick={handleCreateKb}
            disabled={!newKbName.trim() || loading}
            className="px-3 py-2 rounded text-sm bg-whynot-accent/20 text-whynot-accent hover:bg-whynot-accent/30 disabled:opacity-50"
          >
            Create KB
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={pathInput}
          onChange={(e) => setPathInput(e.target.value)}
          placeholder="Path to file/folder or URL (http(s)://...)"
          className="flex-1 px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body placeholder-whynot-muted text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={loading}
          className="px-4 py-2 rounded bg-whynot-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          Add to {selectedKb}
        </button>
      </div>

      <div className="rounded-lg border border-whynot-border bg-whynot-surface p-4">
        <h3 className="text-sm font-medium text-whynot-muted mb-2">
          {selectedKb} contents
        </h3>
        <pre className="text-sm text-whynot-body font-mono whitespace-pre-wrap">
          {items.length > 0 ? items.join('\n') : '(empty)'}
        </pre>
      </div>
    </div>
  );
}
