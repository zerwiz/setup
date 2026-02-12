import { useEffect, useState } from 'react';
import { getTools, installTool, type Tool } from '../api';

export default function Tools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [installing, setInstalling] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTools()
      .then((r) => setTools(r.tools ?? []))
      .catch((e) => setError(String(e)));
  }, []);

  const handleInstall = async (index: number) => {
    setInstalling(index);
    setError(null);
    try {
      const res = await installTool(index);
      if (res.error) setError(res.error);
    } catch (e) {
      setError(String(e));
    } finally {
      setInstalling(null);
    }
  };

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-semibold text-whynot-body mb-6">Tools</h2>
      {error && (
        <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-sm">{error}</div>
      )}
      <div className="space-y-4">
        {tools.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-4 rounded-lg border border-whynot-border bg-whynot-surface"
          >
            <div>
              <h3 className="font-medium text-whynot-body">{t.name}</h3>
              <p className="text-sm text-whynot-muted">{t.desc}</p>
              {t.url && (
                <a
                  href={t.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-whynot-link hover:underline mt-1 inline-block"
                >
                  {t.url}
                </a>
              )}
            </div>
            <button
              onClick={() => handleInstall(t.index)}
              disabled={installing !== null}
              className="px-4 py-2 rounded bg-whynot-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {installing === t.index ? 'Installing…' : 'Install'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
