import { useEffect, useState } from 'react';
import { getConfig, getMemoryManual, getMemoryConv, getBehavior, writeMemoryManual, writeMemoryConv, writeBehavior } from '../api';
import FileEditModal from '../components/FileEditModal';

type EditFile = 'memory' | 'conv' | 'behavior' | null;

export default function Settings() {
  const [configDir, setConfigDir] = useState('');
  const [currentDir, setCurrentDir] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editFile, setEditFile] = useState<EditFile>(null);
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    getConfig()
      .then((r) => setCurrentDir(r.config_dir ?? ''));
    if (typeof window !== 'undefined' && window.api?.getConfigDirSetting) {
      window.api.getConfigDirSetting().then((dir) => setConfigDir(dir ?? ''));
    } else {
      getConfig().then((r) => setConfigDir(r.config_dir ?? ''));
    }
  }, []);

  const openModal = async (file: EditFile) => {
    setEditFile(file);
    setEditContent('');
    setEditError(null);
    if (file === 'memory') {
      getMemoryManual().then((r) => setEditContent(r.content ?? '')).catch(() => setEditContent(''));
    } else if (file === 'conv') {
      getMemoryConv().then((r) => setEditContent(r.content ?? '')).catch(() => setEditContent(''));
    } else if (file === 'behavior') {
      getBehavior().then((r) => setEditContent(r.content ?? '')).catch(() => setEditContent(''));
    }
  };

  const handleSaveEdit = async (content: string) => {
    if (!editFile) return;
    setEditLoading(true);
    setEditError(null);
    try {
      let res: { ok?: boolean; error?: string };
      if (editFile === 'memory') res = await writeMemoryManual(content);
      else if (editFile === 'conv') res = await writeMemoryConv(content);
      else res = await writeBehavior(content);
      if (res.error) setEditError(res.error);
      else setEditFile(null);
    } catch (e) {
      setEditError(String(e));
    } finally {
      setEditLoading(false);
    }
  };

  const handleSave = async () => {
    const dir = configDir.trim();
    setError(null);
    if (window.api?.setConfigDirSetting) {
      await window.api.setConfigDirSetting(dir);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError('Cannot save: running in browser. Use Electron app to change settings.');
    }
  };

  const effectiveDir = configDir.trim() || currentDir || '';
  const defaultConfigDir = '~/.config/ai-dev-suite';

  const handleOpenFolder = async () => {
    if (!window.api?.openConfigDirInFileManager) return;
    const dir = effectiveDir || defaultConfigDir;
    const res = await window.api.openConfigDirInFileManager(dir);
    if (!res.ok && res.error) setError(res.error);
  };

  const handleSelectFolder = async () => {
    if (!window.api?.selectDirectory) return;
    const { canceled, path } = await window.api.selectDirectory();
    if (!canceled && path) setConfigDir(path);
  };

  const fileLabels: Record<NonNullable<EditFile>, string> = {
    memory: 'memory.md',
    conv: 'conversation_memory.md',
    behavior: 'behavior.md',
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-whynot-body mb-6">Settings</h2>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-sm">{error}</div>
      )}
      {saved && (
        <div className="mb-4 p-3 rounded bg-green-500/20 border border-green-500/40 text-green-400 text-sm">
          Saved. Restart the app to use the new config directory.
        </div>
      )}

      <div className="space-y-6 rounded-lg border border-whynot-border bg-whynot-surface p-6">
        <div>
          <label className="block text-sm font-medium text-whynot-muted mb-1">Config directory</label>
          <p className="mb-2 text-xs text-whynot-muted">Memory, behavior, drive, and knowledge bases are stored here.</p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={configDir}
              onChange={(e) => setConfigDir(e.target.value)}
              placeholder={currentDir || '~/.config/ai-dev-suite'}
              className="flex-1 min-w-0 px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body placeholder-whynot-muted text-sm font-mono"
            />
            <button
              onClick={handleOpenFolder}
              disabled={!window.api?.openConfigDirInFileManager}
              className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm hover:bg-whynot-border/30 disabled:opacity-50"
            >
              Browse
            </button>
            <button
              onClick={handleSelectFolder}
              disabled={!window.api?.selectDirectory}
              className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm hover:bg-whynot-border/30 disabled:opacity-50"
            >
              Select folder…
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded bg-whynot-accent text-white text-sm font-medium hover:opacity-90"
            >
              Save
            </button>
          </div>
          {currentDir && (
            <p className="mt-2 text-xs text-whynot-muted">Currently in use: <code className="font-mono">{currentDir}</code></p>
          )}
        </div>

        {effectiveDir && (
          <div>
            <label className="block text-sm font-medium text-whynot-muted mb-2">Memory & behavior files</label>
            <p className="text-xs text-whynot-muted mb-2">Click to edit in a modal. behavior.md defines identity, tone, style—used when the user asks &quot;who are you&quot;.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openModal('memory')}
                className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm font-mono hover:bg-whynot-accent/20 hover:border-whynot-accent/40 hover:text-whynot-accent transition-colors"
              >
                memory.md
              </button>
              <button
                type="button"
                onClick={() => openModal('conv')}
                className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm font-mono hover:bg-whynot-accent/20 hover:border-whynot-accent/40 hover:text-whynot-accent transition-colors"
              >
                conversation_memory.md
              </button>
              <button
                type="button"
                onClick={() => openModal('behavior')}
                className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm font-mono hover:bg-whynot-accent/20 hover:border-whynot-accent/40 hover:text-whynot-accent transition-colors"
              >
                behavior.md
              </button>
            </div>
            <p className="mt-2 text-xs text-whynot-muted">drive/ · knowledge-bases/ — Location: {effectiveDir}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-whynot-muted mb-1">API</label>
          <p className="text-sm text-whynot-body">The Elixir API runs at http://localhost:41434</p>
        </div>
      </div>

      {editFile && (
        <FileEditModal
          title={`Edit ${fileLabels[editFile]}`}
          content={editContent}
          onSave={handleSaveEdit}
          onClose={() => setEditFile(null)}
          loading={editLoading}
          error={editError}
        />
      )}
    </div>
  );
}
