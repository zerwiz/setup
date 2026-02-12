import { useEffect, useState } from 'react';
import {
  getServerConfig,
  getServerStatus,
  putServerConfig,
  startServer,
  stopServer,
  type ServerConfig,
} from '../api';

export default function Server() {
  const [config, setConfig] = useState<ServerConfig>({
    model_path: '',
    port: 8080,
    server_path: '',
  });
  const [status, setStatus] = useState<{ running: boolean; port?: number; model_path?: string; server_path?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refreshStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfgRes, statusRes] = await Promise.all([getServerConfig(), getServerStatus()]);
      if (cfgRes.error) setError(cfgRes.error);
      else
        setConfig({
          model_path: cfgRes.model_path ?? '',
          port: cfgRes.port ?? 8080,
          server_path: cfgRes.server_path ?? '',
        });
      if (statusRes.error) setError(statusRes.error);
      else setStatus(statusRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleSaveConfig = async () => {
    setActionLoading('save');
    setError(null);
    setMessage(null);
    try {
      const res = await putServerConfig({
        model_path: config.model_path?.trim() || '',
        port: config.port,
        server_path: config.server_path?.trim() || '',
      });
      if (res.error) setError(res.error);
      else {
        setMessage('Config saved.');
        setConfig({
          model_path: res.model_path ?? config.model_path,
          port: res.port ?? config.port,
          server_path: res.server_path ?? config.server_path,
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStart = async () => {
    setActionLoading('start');
    setError(null);
    try {
      const res = await startServer();
      if (res.error) setError(res.error);
      else await refreshStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStop = async () => {
    setActionLoading('stop');
    setError(null);
    try {
      const res = await stopServer();
      if (res.error) setError(res.error);
      else await refreshStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to stop');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectModelFile = async () => {
    if (!window.api?.selectFile) {
      setError('Use Electron app to select files.');
      return;
    }
    const { canceled, path } = await window.api.selectFile({ filters: [{ name: 'Models', extensions: ['gguf'] }] });
    if (!canceled && path) setConfig((c) => ({ ...c, model_path: path }));
  };

  const handleSelectServerBinary = async () => {
    if (!window.api?.selectFile) {
      setError('Use Electron app to select files.');
      return;
    }
    const { canceled, path } = await window.api.selectFile({ filters: [{ name: 'Executable', extensions: ['*'] }] });
    if (!canceled && path) setConfig((c) => ({ ...c, server_path: path }));
  };

  const running = status?.running ?? false;
  const isBusy = !!actionLoading;

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-whynot-body mb-4">Server</h2>
      <p className="text-whynot-muted text-sm mb-6">
        Run a llama.cpp server as an alternative to Ollama. Point to a GGUF model and start the server.
        Use <code className="px-1 py-0.5 rounded bg-whynot-border/30">./server -m model.gguf --port 8080</code>.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-sm">{error}</div>
      )}
      {message && (
        <div className="mb-4 p-3 rounded bg-green-500/20 border border-green-500/40 text-green-400 text-sm">
          {message}
        </div>
      )}

      <div className="space-y-6 rounded-lg border border-whynot-border bg-whynot-surface p-6">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-whynot-muted mb-1">Status</label>
          {loading ? (
            <p className="text-whynot-muted text-sm">Loading…</p>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-sm font-medium ${
                  running ? 'bg-green-500/20 text-green-400' : 'bg-whynot-border/30 text-whynot-muted'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${running ? 'bg-green-500 animate-pulse' : 'bg-whynot-muted'}`} />
                {running ? `Running on port ${status?.port ?? '?'}` : 'Stopped'}
              </span>
              {running && status?.model_path && (
                <code className="text-xs text-whynot-muted truncate max-w-xs" title={status.model_path}>
                  {status.model_path}
                </code>
              )}
            </div>
          )}
        </div>

        {/* Config form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-whynot-muted mb-1">Model path (GGUF)</label>
            <p className="mb-2 text-xs text-whynot-muted">Path to your .gguf model file. Required to start.</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.model_path ?? ''}
                onChange={(e) => setConfig((c) => ({ ...c, model_path: e.target.value }))}
                placeholder="/path/to/model.gguf"
                className="flex-1 min-w-0 px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body placeholder-whynot-muted text-sm font-mono"
              />
              <button
                onClick={handleSelectModelFile}
                disabled={!window.api?.selectFile}
                className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm hover:bg-whynot-border/30 disabled:opacity-50"
              >
                Browse…
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-whynot-muted mb-1">Port</label>
            <input
              type="number"
              value={config.port ?? 8080}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!isNaN(n)) setConfig((c) => ({ ...c, port: n }));
              }}
              min={1}
              max={65535}
              className="w-24 px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-whynot-muted mb-1">Server binary (optional)</label>
            <p className="mb-2 text-xs text-whynot-muted">
              Path to llama.cpp <code className="font-mono">server</code> executable. If empty, auto-detected.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.server_path ?? ''}
                onChange={(e) => setConfig((c) => ({ ...c, server_path: e.target.value }))}
                placeholder="Auto-detect"
                className="flex-1 min-w-0 px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body placeholder-whynot-muted text-sm font-mono"
              />
              <button
                onClick={handleSelectServerBinary}
                disabled={!window.api?.selectFile}
                className="px-3 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm hover:bg-whynot-border/30 disabled:opacity-50"
              >
                Browse…
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={handleSaveConfig}
            disabled={isBusy}
            className="px-4 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm font-medium hover:bg-whynot-border/30 disabled:opacity-50"
          >
            {actionLoading === 'save' ? 'Saving…' : 'Save config'}
          </button>
          <button
            onClick={handleStart}
            disabled={isBusy || running}
            className="px-4 py-2 rounded bg-green-600 text-white text-sm font-medium hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'start' ? 'Starting…' : 'Start server'}
          </button>
          <button
            onClick={handleStop}
            disabled={isBusy || !running}
            className="px-4 py-2 rounded bg-red-600/80 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === 'stop' ? 'Stopping…' : 'Stop server'}
          </button>
          <button
            onClick={refreshStatus}
            disabled={loading}
            className="px-4 py-2 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm hover:bg-whynot-border/30 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
