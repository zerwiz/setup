/// <reference types="vite/client" />

interface Window {
  debugApi?: {
    readLog: (name: 'api' | 'ollama' | 'a2a' | 'rag' | 'electron') => Promise<{ lines: string[]; error: string | null }>;
    getHealth: () => Promise<{ api: string; ollama: string; vite: string }>;
    runTestChat: () => Promise<{ ok: boolean; output: string; error: string | null }>;
    runAnalysis: (payload: { context: string; model?: string | null }) => Promise<{ ok: boolean; text: string; error: string | null }>;
    getMemory: () => Promise<{ content: string; error: string | null }>;
    saveFix: (payload: { issueSummary: string; fix: string }) => Promise<{ ok: boolean; error: string | null }>;
    getProcesses: () => Promise<{ header: string; all: string[]; terminals: string[]; relevant: string[]; error: string | null }>;
    getFiles: () => Promise<{ configDir: string; configFiles: string[]; logFiles: { path: string; size: number; mtime: string }[]; projectRoot: string; projectFiles: string[]; error: string | null }>;
    getOllamaModels: () => Promise<{ models: string[]; error: string | null }>;
    startScript: (scriptId: 'api' | 'ollama') => Promise<{ ok: boolean; output: string; error: string | null }>;
    freePort: (port?: number) => Promise<{ ok: boolean; output: string; error: string | null }>;
    selectFile: () => Promise<{ path: string | null; error: string | null }>;
    selectFileForEdit: () => Promise<{ path: string | null; error: string | null }>;
    readFile: (path: string) => Promise<{ content: string; error: string | null }>;
    writeFile: (path: string, content: string) => Promise<{ ok: boolean; error: string | null }>;
    runCommand: (cmd: string) => Promise<{ ok: boolean; output: string; error: string | null }>;
    chat: (payload: { messages: { role: string; content: string }[]; context?: string; model?: string | null }) => Promise<{ ok: boolean; text: string; error: string | null }>;
  };
}
