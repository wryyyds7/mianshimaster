import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiMode, ILocalApiConfig, IServerApiConfig, ISTTApiConfig, Theme, Language, IUser } from '@shared/types';

interface ConfigState {
  apiMode: ApiMode;
  localApi: ILocalApiConfig;
  serverApi: IServerApiConfig & { user: IUser | null };
  sttApi: ISTTApiConfig;
  theme: Theme;
  language: Language;

  // 操作
  setApiMode: (mode: ApiMode) => void;
  updateLocalApiConfig: (config: Partial<ILocalApiConfig>) => void;
  setServerUrl: (url: string) => void;
  setServerToken: (token: string, user: IUser) => void;
  clearServerSession: () => void;
  updateSTTConfig: (config: Partial<ISTTApiConfig>) => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;

  // 判断
  isConfigured: () => boolean;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      apiMode: 'local' as ApiMode,
      localApi: {
        provider: 'openai',
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 4096,
      },
      serverApi: {
        baseUrl: 'http://localhost:3001',
        isLoggedIn: false,
        token: null,
        user: null,
      },
      sttApi: {
        provider: 'web-speech',
        apiKey: '',
        baseUrl: '',
        language: 'zh-CN',
      },
      theme: 'system' as Theme,
      language: 'zh-CN' as Language,

      setApiMode: (mode) => set({ apiMode: mode }),

      updateLocalApiConfig: (config) =>
        set((state) => ({
          localApi: { ...state.localApi, ...config },
        })),

      setServerUrl: (url) =>
        set((state) => ({
          serverApi: { ...state.serverApi, baseUrl: url },
        })),

      setServerToken: (token, user) =>
        set({
          serverApi: {
            ...get().serverApi,
            isLoggedIn: true,
            token,
            user,
          },
        }),

      clearServerSession: () =>
        set({
          serverApi: {
            baseUrl: get().serverApi.baseUrl,
            isLoggedIn: false,
            token: null,
            user: null,
          },
        }),

      updateSTTConfig: (config) =>
        set((state) => ({
          sttApi: { ...state.sttApi, ...config },
        })),

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      setLanguage: (lang) => set({ language: lang }),

      isConfigured: () => {
        const state = get();
        // 必须填写了apiKey才算已配置（custom provider也需要配置）
        return state.localApi.apiKey.length > 0;
      },
    }),
    {
      name: 'mianshimaster-config',
      partialize: (state) => ({
        apiMode: state.apiMode,
        localApi: {
          ...state.localApi,
          apiKey: '', // API Key不持久化明文（实际使用时加密存储）
        },
        serverApi: {
          baseUrl: state.serverApi.baseUrl,
          isLoggedIn: state.serverApi.isLoggedIn,
          token: state.serverApi.token,       // 持久化token以支持刷新后保持登录
          user: state.serverApi.user,
        },
        sttApi: {
          provider: state.sttApi.provider,
          apiKey: '', // STT API Key 也不明文持久化
          baseUrl: state.sttApi.baseUrl,
          language: state.sttApi.language,
        },
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);

// 应用主题
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}
