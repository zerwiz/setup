/// <reference types="vite/client" />

interface Window {
  api?: {
    base: string;
    fetch(path: string, options?: RequestInit): Promise<unknown>;
    chatStream?: (
      body: Record<string, unknown>,
      callbacks: { onChunk: (d: { delta?: string; thinking?: string; done?: boolean }) => void; onDone: () => void; onError: (e: string) => void }
    ) => void;
    chatStreamAbort?: () => void;
    get(path: string): Promise<unknown>;
    post(path: string, body: unknown, opts?: { timeout?: number }): Promise<unknown>;
    put(path: string, body: unknown, opts?: { timeout?: number }): Promise<unknown>;
    delete?(path: string): Promise<unknown>;
    uploadFile(path: string, file: File): Promise<unknown>;
    quitApp?: () => Promise<void>;
    selectFilesAndFolders?: () => Promise<{ canceled?: boolean; paths: string[] }>;
    selectDirectory?: () => Promise<{ canceled?: boolean; path: string }>;
    selectFile?: (opts?: { title?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<{ canceled?: boolean; path: string }>;
    openConfigDirInFileManager?: (dir: string) => Promise<{ ok: boolean; error?: string }>;
    getConfigDirSetting?: () => Promise<string>;
    setConfigDirSetting?: (dir: string) => Promise<{ ok: boolean }>;
  };
}
