import { useState } from 'react';
import { useChat } from '../contexts/ChatContext';
import { saveConversationFacts } from '../api';

export default function QuitButton() {
  const [saving, setSaving] = useState(false);
  const { activeChat, saveNow } = useChat();

  if (typeof window === 'undefined' || !window.api || typeof window.api.quitApp !== 'function') return null;

  const handleQuit = async () => {
    setSaving(true);
    try {
      saveNow();
      if (activeChat && activeChat.messages.length >= 2) {
        await saveConversationFacts(
          activeChat.selectedModel,
          activeChat.messages.map((m) => ({ role: m.role, content: m.content }))
        );
      }
      await window.api!.quitApp!();
    } catch {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleQuit}
      disabled={saving}
      className="px-3 py-2 rounded text-sm text-red-500 hover:text-red-400 hover:bg-red-500/20 disabled:opacity-50"
      title="Quit and save workspace, chats, and conversation memory"
    >
      {saving ? 'Saving…' : 'Quit'}
    </button>
  );
}
