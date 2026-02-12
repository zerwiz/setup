import { useEffect, useState } from 'react';
import { getConfig } from '../api';

export default function Settings() {
  const [configDir, setConfigDir] = useState('');

  useEffect(() => {
    getConfig()
      .then((r) => setConfigDir(r.config_dir ?? ''))
      .catch(() => setConfigDir(''));
  }, []);

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-whynot-body mb-6">Settings</h2>

      <div className="space-y-4 rounded-lg border border-whynot-border bg-whynot-surface p-6">
        <div>
          <label className="block text-sm font-medium text-whynot-muted mb-1">Config directory</label>
          <code className="block text-sm text-whynot-body font-mono break-all">{configDir || '–'}</code>
          <p className="mt-1 text-xs text-whynot-muted">Memory, behavior, drive, and other data are stored here.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-whynot-muted mb-1">API</label>
          <p className="text-sm text-whynot-body">The Elixir API runs at http://localhost:41434</p>
        </div>
      </div>
    </div>
  );
}
