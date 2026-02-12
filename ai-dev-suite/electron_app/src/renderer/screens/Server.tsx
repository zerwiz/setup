/**
 * Server – Placeholder for future llama.cpp server integration.
 * See tools/doc/ai-dev-suite/LLAMACPP.md for server mode: ./server -m model.gguf
 */
export default function Server() {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-whynot-body mb-4">Server</h2>
      <p className="text-whynot-muted text-sm mb-6">
        Future integration point for llama.cpp server mode. Run models as local servers
        (e.g. <code className="px-1 py-0.5 rounded bg-whynot-border/30">./server -m model.gguf</code>).
      </p>
      <div className="rounded border border-whynot-border bg-whynot-surface/50 px-4 py-6 text-center">
        <span className="text-whynot-muted text-sm">Integration coming later</span>
      </div>
    </div>
  );
}
