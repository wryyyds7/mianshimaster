import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { useConfigStore } from '../stores/configStore';
import { useSessionStore } from '../stores/sessionStore';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import { DEFAULT_MODELS, API_PROVIDERS } from '../utils/constants';
import { Server, Key, Globe, Cpu, Languages, Download, Database } from 'lucide-react';

export default function SettingsPage() {
  const {
    apiMode, localApi, serverApi, language, theme,
    setApiMode, updateLocalApiConfig, setServerUrl, setTheme, setLanguage,
  } = useConfigStore();

  const { historySessions } = useSessionStore();
  const { items: knowledgeItems } = useKnowledgeStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [serverUrl, setLocalServerUrl] = useState(serverApi.baseUrl);

  // 导出全部数据
  const handleExportAll = () => {
    const data = {
      exportTime: new Date().toISOString(),
      sessions: historySessions,
      knowledge: knowledgeItems,
      config: {
        apiMode,
        theme,
        language,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mianshimaster-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">设置</h1>

        {/* 运行模式 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            运行模式
          </h2>
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              onClick={() => setApiMode('local')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                apiMode === 'local'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Key className="w-4 h-4 inline mr-1" />
              本地API
            </button>
            <button
              onClick={() => setApiMode('server')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                apiMode === 'server'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Server className="w-4 h-4 inline mr-1" />
              服务器API
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            本地API优先使用，也可在登录后切换为服务器API
          </p>
        </section>

        {/* 服务器模式设置 */}
        {apiMode === 'server' && (
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Server className="w-5 h-5" />
              服务器配置
            </h2>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">服务器地址</label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setLocalServerUrl(e.target.value)}
                onBlur={() => setServerUrl(serverUrl.trim() || 'http://localhost:3001')}
                placeholder="http://localhost:3001"
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-gray-400">
              {serverApi.isLoggedIn ? `已登录: ${serverApi.user?.username || ''}` : '未登录，请前往登录页面'}
            </p>
          </section>
        )}

        {/* 本地API配置 */}
        {apiMode === 'local' && (
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Key className="w-5 h-5" />
              本地API配置
            </h2>

            {/* 模型提供商 */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">提供商</label>
              <select
                value={localApi.provider}
                onChange={(e) => updateLocalApiConfig({ provider: e.target.value as any })}
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {API_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* API Key */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={localApi.apiKey}
                  onChange={(e) => updateLocalApiConfig({ apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full h-10 px-3 pr-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? '隐藏' : '显示'}
                </button>
              </div>
            </div>

            {/* Base URL */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                Base URL
              </label>
              <input
                type="text"
                value={localApi.baseUrl}
                onChange={(e) => updateLocalApiConfig({ baseUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* 模型选择 */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" />
                模型
              </label>
              <select
                value={localApi.model}
                onChange={(e) => updateLocalApiConfig({ model: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DEFAULT_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Temperature */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Temperature: {localApi.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={localApi.temperature}
                onChange={(e) => updateLocalApiConfig({ temperature: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </section>
        )}

        {/* 外观设置 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">外观与语言</h2>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">主题</label>
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                    theme === t
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {t === 'light' ? '浅色' : t === 'dark' ? '深色' : '跟随系统'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <Languages className="w-3.5 h-3.5" />
              语言
            </label>
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
              {(['zh-CN', 'en-US'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                    language === l
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {l === 'zh-CN' ? '中文' : 'English'}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 数据管理 */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Database className="w-5 h-5" />
            数据管理
          </h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">导出全部数据</p>
              <p className="text-xs text-gray-400">导出会话记录、知识库和配置</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportAll}>
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">数据统计</p>
              <p className="text-xs text-gray-400">
                {historySessions.length} 个会话 | {knowledgeItems.length} 条知识
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
