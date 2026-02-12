import { useEffect, useState } from 'react';
import {
  getKnowledgeBases,
  getKnowledgeBaseContents,
  createKnowledgeBase,
  addToKnowledgeBase,
  deleteFromKnowledgeBase,
  deleteBatchFromKnowledgeBase,
  deleteAllFromKnowledgeBase,
  deleteKnowledgeBase,
  type DriveItem,
} from '../api';
import DriveExplorer from '../components/DriveExplorer';

export default function Drive() {
  const [knowledgeBases, setKnowledgeBases] = useState<string[]>(['default']);
  const [selectedKb, setSelectedKb] = useState<string>('default');
  const [items, setItems] = useState<DriveItem[]>([]);
  const [pathInput, setPathInput] = useState('');
  const [newKbName, setNewKbName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

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

  const handleDelete = async (item: DriveItem) => {
    if (loading) return;
    if (!confirm(`Delete "${item.path}"?`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await deleteFromKnowledgeBase(selectedKb, item.path);
      if (res.error) setError(res.error);
      else {
        loadContents();
        loadKbs();
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => loadKbs(), []);
  useEffect(() => loadContents(), [selectedKb]);
  useEffect(() => setSelectedPaths(new Set()), [selectedKb]);

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

  const handleBrowse = async () => {
    if (loading || !window.api?.selectFilesAndFolders) return;
    setLoading(true);
    setError(null);
    try {
      const { canceled, paths } = await window.api.selectFilesAndFolders();
      if (canceled || paths.length === 0) {
        setLoading(false);
        return;
      }
      let lastError: string | null = null;
      for (const p of paths) {
        const res = await addToKnowledgeBase(selectedKb, p);
        if (res.error) {
          lastError = res.error;
          setError(res.error);
          break;
        }
      }
      if (paths.length > 0 && !lastError) {
        loadContents();
        loadKbs();
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    const paths = [...selectedPaths];
    if (paths.length === 0 || loading) return;
    // Remove descendants: if parent is selected, skip child paths to avoid double-delete
    const toDelete = paths.filter(
      (p) => !paths.some((other) => other !== p && (p === other || p.startsWith(other + '/')))
    );
    if (!confirm(`Delete ${toDelete.length} selected item(s)?`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await deleteBatchFromKnowledgeBase(selectedKb, toDelete);
      if (res.error) setError(res.error);
      else {
        setSelectedPaths(new Set());
        loadContents();
        loadKbs();
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (loading) return;
    if (!confirm(`Delete ALL files in "${selectedKb === 'default' ? 'default (drive)' : selectedKb}"? This cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await deleteAllFromKnowledgeBase(selectedKb);
      if (res.error) setError(res.error);
      else {
        setSelectedPaths(new Set());
        loadContents();
        loadKbs();
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKb = async () => {
    if (selectedKb === 'default') return;
    if (loading) return;
    if (!confirm(`Delete entire knowledge base "${selectedKb}"? All files will be removed. This cannot be undone.`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await deleteKnowledgeBase(selectedKb);
      if (res.error) setError(res.error);
      else {
        setSelectedPaths(new Set());
        setSelectedKb('default');
        loadKbs();
        loadContents();
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
                {kb === 'default' ? 'default (drive)' : kb}
              </option>
            ))}
          </select>
        </div>
        {selectedKb !== 'default' && (
          <button
            onClick={handleDeleteKb}
            disabled={loading}
            className="self-end px-3 py-2 rounded text-sm border border-red-500/50 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
            title="Delete this knowledge base"
          >
            Delete KB
          </button>
        )}
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

      <div className="flex gap-2 mb-6 flex-wrap">
        <input
          type="text"
          value={pathInput}
          onChange={(e) => setPathInput(e.target.value)}
          placeholder="Path to file/folder or URL (http(s)://...)"
          className="flex-1 min-w-0 px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body placeholder-whynot-muted text-sm"
        />
        <button
          onClick={handleBrowse}
          disabled={loading || !window.api?.selectFilesAndFolders}
          className="px-4 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm font-medium hover:bg-whynot-surface/80 disabled:opacity-50"
          title="Select files or folders from your computer"
        >
          Browse files & folders
        </button>
        <button
          onClick={handleAdd}
          disabled={loading}
          className="px-4 py-2 rounded bg-whynot-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          Add to {selectedKb === 'default' ? 'default (drive)' : selectedKb}
        </button>
      </div>

      <div className="rounded-lg border border-whynot-border bg-whynot-surface p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-whynot-muted">
            {selectedKb === 'default' ? 'default (drive)' : selectedKb} — File explorer
          </h3>
          <button
            onClick={handleDeleteAll}
            disabled={loading || items.length === 0}
            className="text-xs text-red-400/80 hover:text-red-400 disabled:opacity-50"
            title="Delete all files in this KB"
          >
            Delete all files
          </button>
        </div>
        <DriveExplorer
          items={items}
          selectedPaths={selectedPaths}
          onToggleSelect={(path) => setSelectedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
          })}
          onSelectAll={() => setSelectedPaths(new Set(items.map((i) => i.path)))}
          onDeselectAll={() => setSelectedPaths(new Set())}
          onDelete={handleDelete}
          onDeleteSelected={handleDeleteSelected}
          loading={loading}
        />
      </div>
    </div>
  );
}
