import { useEffect, useRef } from 'react';

type Props = {
  title: string;
  content: string;
  onSave: (content: string) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
};

export default function FileEditModal({ title, content, onSave, onClose, loading, error }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = textareaRef.current?.value ?? content;
    await onSave(value);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-lg border border-whynot-border bg-whynot-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-whynot-border px-4 py-3">
          <h3 className="text-lg font-semibold text-whynot-body">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-whynot-muted hover:text-whynot-body p-1 rounded"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0">
          <div className="flex-1 min-h-0 p-4">
            {error && (
              <div className="mb-3 p-3 rounded bg-red-500/20 border border-red-500/40 text-red-400 text-sm">{error}</div>
            )}
            <textarea
              ref={textareaRef}
              name="content"
              defaultValue={content}
              className="w-full h-64 p-3 rounded border border-whynot-border bg-whynot-surface text-whynot-body text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-whynot-accent"
              placeholder="File content..."
              disabled={loading}
              spellCheck={false}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-whynot-border px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-whynot-border text-whynot-body text-sm hover:bg-whynot-border/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-whynot-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
