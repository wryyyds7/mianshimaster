import { contextBridge, ipcRenderer } from 'electron';

// 暴露给渲染进程的安全API
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },

  // 文件操作
  dialog: {
    openFile: (options?: Record<string, unknown>) =>
      ipcRenderer.invoke('dialog:openFile', options),
  },

  // 系统功能
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  },

  // 应用信息
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
  },

  // 数据库操作（本地SQLite）
  db: {
    query: (sql: string, params?: unknown[]) =>
      ipcRenderer.invoke('db:query', sql, params),
    execute: (sql: string, params?: unknown[]) =>
      ipcRenderer.invoke('db:execute', sql, params),
    run: (sql: string, params?: unknown[]) =>
      ipcRenderer.invoke('db:run', sql, params),
  },
});
