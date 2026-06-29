// Global type for preload API
interface Window {
  electronAPI?: {
    window: {
      minimize: () => Promise<void>;
      maximize: () => Promise<boolean>;
      close: () => Promise<void>;
    };
    dialog: {
      openFile: (options?: Record<string, unknown>) => Promise<string[]>;
    };
    shell: {
      openExternal: (url: string) => Promise<void>;
    };
    app: {
      getVersion: () => Promise<string>;
    };
    db: {
      query: (sql: string, params?: unknown[]) => Promise<unknown[]>;
      execute: (sql: string, params?: unknown[]) => Promise<unknown>;
      run: (sql: string, params?: unknown[]) => Promise<unknown>;
    };
  };
}
