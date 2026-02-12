import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type ChatSession = {
  id: string;
  messages: ChatMessage[];
  selectedModel: string;
  knowledgeBase: string;
  title: string;
};

const STORAGE_KEY = 'zerwiz-ai-dev-suite-chats';

function newId() {
  return 'chat-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

function chatTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (first) {
    const text = first.content.slice(0, 24).replace(/\n/g, ' ');
    return text + (first.content.length > 24 ? '…' : '');
  }
  return 'New chat';
}

function isValidMessage(m: unknown): m is ChatMessage {
  if (!m || typeof m !== 'object') return false;
  const o = m as Record<string, unknown>;
  return (o.role === 'user' || o.role === 'assistant') && typeof o.content === 'string';
}

function isValidSession(obj: unknown): obj is ChatSession {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    Array.isArray(o.messages) &&
    o.messages.every(isValidMessage) &&
    typeof (o.selectedModel ?? '') === 'string' &&
    typeof (o.knowledgeBase ?? '') === 'string' &&
    typeof (o.title ?? '') === 'string'
  );
}

function loadPersistedState(): { chats: ChatSession[]; activeChatId: string | null } | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return null;
    const data = JSON.parse(raw) as { chats?: unknown[]; activeChatId?: string | null };
    if (!data || !Array.isArray(data.chats) || data.chats.length === 0) return null;
    const chats = data.chats
      .filter(isValidSession)
      .map((c) => ({
        ...c,
        selectedModel: c.selectedModel || 'llama3.2:latest',
        knowledgeBase: c.knowledgeBase || 'default',
        title: c.title || 'New chat',
      }));
    if (chats.length === 0) return null;
    const activeChatId = typeof data.activeChatId === 'string' && chats.some((c) => c.id === data.activeChatId)
      ? data.activeChatId
      : chats[0]!.id;
    return { chats, activeChatId };
  } catch {
    return null;
  }
}

function savePersistedState(chats: ChatSession[], activeChatId: string | null) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ chats, activeChatId }));
    }
  } catch {
    /* ignore */
  }
}

type ChatContextType = {
  chats: ChatSession[];
  activeChatId: string | null;
  activeChat: ChatSession | null;
  createChat: () => string;
  switchChat: (id: string) => void;
  deleteChat: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setSelectedModel: (model: string) => void;
  setKnowledgeBase: (kb: string) => void;
  setChatTitle: (id: string, title: string) => void;
  saveNow: () => void;
};

const ChatContext = createContext<ChatContextType | null>(null);

const DEFAULT_MODEL = 'llama3.2:latest';

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<ChatSession[]>(() => {
    const persisted = loadPersistedState();
    if (persisted) return persisted.chats;
    const id = newId();
    return [{ id, messages: [], selectedModel: DEFAULT_MODEL, knowledgeBase: 'default', title: 'New chat' }];
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(() => {
    const persisted = loadPersistedState();
    return persisted ? persisted.activeChatId : null;
  });

  useEffect(() => {
    savePersistedState(chats, activeChatId ?? chats[0]?.id ?? null);
  }, [chats, activeChatId]);

  const resolvedActiveId = activeChatId ?? chats[0]?.id ?? null;
  const activeChat = resolvedActiveId
    ? chats.find((c) => c.id === resolvedActiveId) ?? chats[0]
    : chats[0];

  const createChat = useCallback(() => {
    const id = newId();
    const model = activeChat?.selectedModel ?? DEFAULT_MODEL;
    const kb = activeChat?.knowledgeBase ?? 'default';
    const session: ChatSession = { id, messages: [], selectedModel: model, knowledgeBase: kb, title: 'New chat' };
    setChats((prev) => [...prev, session]);
    setActiveChatId(id);
    return id;
  }, [activeChat]);

  const switchChat = useCallback((id: string) => {
    setActiveChatId(id);
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const newChatId = newId();
        setActiveChatId(newChatId);
        return [{ id: newChatId, messages: [], selectedModel: DEFAULT_MODEL, knowledgeBase: 'default', title: 'New chat' }];
      }
      if (resolvedActiveId === id) {
        setActiveChatId(next[0].id);
      }
      return next;
    });
  }, [resolvedActiveId]);

  const addMessage = useCallback((msg: ChatMessage) => {
    const targetId = resolvedActiveId ?? chats[0]?.id;
    if (!targetId) return;
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== targetId) return c;
        const messages = [...c.messages, msg];
        return { ...c, messages, title: c.messages.length === 0 ? chatTitle(messages) : c.title };
      })
    );
  }, [resolvedActiveId, chats]);

  const setSelectedModel = useCallback((model: string) => {
    const targetId = resolvedActiveId ?? chats[0]?.id;
    if (!targetId) return;
    setChats((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, selectedModel: model } : c))
    );
  }, [resolvedActiveId, chats]);

  const setKnowledgeBase = useCallback((kb: string) => {
    const targetId = resolvedActiveId ?? chats[0]?.id;
    if (!targetId) return;
    setChats((prev) =>
      prev.map((c) => (c.id === targetId ? { ...c, knowledgeBase: kb } : c))
    );
  }, [resolvedActiveId, chats]);

  const setChatTitle = useCallback((id: string, title: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }, []);

  const saveNow = useCallback(() => {
    savePersistedState(chats, activeChatId ?? chats[0]?.id ?? null);
  }, [chats, activeChatId]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId: resolvedActiveId,
        activeChat: activeChat ?? null,
        createChat,
        switchChat,
        deleteChat,
        addMessage,
        setSelectedModel,
        setKnowledgeBase,
        setChatTitle,
        saveNow,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
