import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('debugApi', {
  readLog: (name: 'api' | 'ollama' | 'a2a' | 'rag' | 'electron') => ipcRenderer.invoke('debug:readLog', name),
  getHealth: () => ipcRenderer.invoke('debug:getHealth'),
  runTestChat: () => ipcRenderer.invoke('debug:runTestChat'),
  runAnalysis: (payload: { context: string; model?: string | null }) => ipcRenderer.invoke('debug:runAnalysis', payload),
  getMemory: () => ipcRenderer.invoke('debug:getMemory'),
  saveFix: (payload: { issueSummary: string; fix: string }) => ipcRenderer.invoke('debug:saveFix', payload),
  getProcesses: () => ipcRenderer.invoke('debug:getProcesses'),
  getFiles: () => ipcRenderer.invoke('debug:getFiles'),
  getOllamaModels: () => ipcRenderer.invoke('debug:getOllamaModels'),
  startScript: (scriptId: 'api' | 'ollama') => ipcRenderer.invoke('debug:startScript', scriptId),
  freePort: (port?: number) => ipcRenderer.invoke('debug:freePort', port ?? 11434),
  selectFile: () => ipcRenderer.invoke('debug:selectFile'),
  selectFileForEdit: () => ipcRenderer.invoke('debug:selectFileForEdit'),
  readFile: (p: string) => ipcRenderer.invoke('debug:readFile', p),
  writeFile: (p: string, content: string) => ipcRenderer.invoke('debug:writeFile', p, content),
  runCommand: (cmd: string) => ipcRenderer.invoke('debug:runCommand', cmd),
  chat: (payload: { messages: { role: string; content: string }[]; context?: string; model?: string | null }) => ipcRenderer.invoke('debug:chat', payload),
});
