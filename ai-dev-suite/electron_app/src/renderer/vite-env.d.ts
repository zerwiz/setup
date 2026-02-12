/// <reference types="vite/client" />

interface Window {
  api?: {
    base: string;
    fetch(path: string, options?: RequestInit): Promise<unknown>;
    get(path: string): Promise<unknown>;
    post(path: string, body: unknown, opts?: { timeout?: number }): Promise<unknown>;
    uploadFile(path: string, file: File): Promise<unknown>;
    quitApp?: () => Promise<void>;
  };
}
