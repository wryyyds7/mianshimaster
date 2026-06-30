import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import { useConfigStore } from '../stores/configStore';
import { useSessionStore } from '../stores/sessionStore';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import ApiTestPanel from '../components/settings/ApiTestPanel';
import { DEFAULT_MODELS, API_PROVIDERS, getDefaultModel } from '../utils/constants';
import { Server, Key, Globe, Cpu, Languages, Download, Database, ArrowLeft, Mic } from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    apiMode, localApi, serverApi, sttApi, language, theme,
    setApiMode, updateLocalApiConfig, setTheme, setLanguage, updateSTTConfig,
  } = useConfigStore();

  const { historySessions } = useSessionStore();
  const { items: knowledgeItems } = useKnowledgeStore();

  const [showApiKey, setShowApiKey] = useState(false);
  const [showSttApiKey, setShowSttApiKey] = useState(false);

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
        {/* 返回按钮 */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">设置</h1>

        {/* ========== API 来源选择 ========== */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Server className="w-5 h-5" />
            API 来源
          </h2>
          <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
            <button
              onClick={() => setApiMode('local')}
              className={cn(
                'flex-1 py-2.5 text-sm font-medium rounded-md transition-colors',
                apiMode === 'local'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Key className="w-4 h-4 inline mr-1.5" />
              自己配置 API
            </button>
            <button
              onClick={() => setApiMode('server')}
              className={cn(
                'flex-1 py-2.5 text-sm font-medium rounded-md transition-colors',
                apiMode === 'server'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Server className="w-4 h-4 inline mr-1.5" />
              使用服务器
            </button>
          </div>
          <p className="text-xs text-gray-400">
            {apiMode === 'local'
              ? '使用自己的 LLM 和 STT API Key，完全掌控用量'
              : '无需配置，使用服务器端提供的 API（需要登录）'}
          </p>
        </section>

        {/* ========== 服务器模式（仅显示登录状态）========== */}
        {apiMode === 'server' && (
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Server className="w-5 h-5" />
              服务器状态
            </h2>
            {serverApi.isLoggedIn ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-emerald-700 font-bold text-sm">
                  {serverApi.user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    已登录: {serverApi.user?.username || '用户'}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    使用服务器 API 无需额外配置
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  使用服务器 API 需要先登录账号
                </p>
                <Button onClick={() => navigate('/login')} size="sm">
                  前往登录
                </Button>
              </div>
            )}
          </section>
        )}

        {/* ========== 自己配置模式：LLM API ========== */}
        {apiMode === 'local' && (
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Key className="w-5 h-5" />
              LLM 大模型 API
            </h2>

            {/* 提供商 */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">提供商</label>
              <select
                value={localApi.provider}
                onChange={(e) => {
                  const newProvider = e.target.value;
                  const providerInfo = API_PROVIDERS.find(p => p.value === newProvider);
                  updateLocalApiConfig({
                    provider: newProvider as any,
                    ...(providerInfo?.baseUrl ? { baseUrl: providerInfo.baseUrl } : {}),
                    model: getDefaultModel(newProvider),
                  });
                }}
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

        {/* ========== 自己配置模式：STT 语音识别 ========== */}
        {apiMode === 'local' && (
          <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Mic className="w-5 h-5" />
              语音识别 (STT)
            </h2>

            {/* STT 提供商 */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">提供商</label>
              <select
                value={sttApi.provider}
                onChange={(e) => updateSTTConfig({ provider: e.target.value as any })}
                className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="web-speech">浏览器内置 (免费)</option>
                <option value="openai-whisper">OpenAI Whisper</option>
                <option value="tencent-asr">腾讯云 ASR</option>
              </select>
            </div>

            {/* STT API Key — 浏览器内置不需要 */}
            {sttApi.provider !== 'web-speech' && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  STT API Key
                </label>
                <div className="relative">
                  <input
                    type={showSttApiKey ? 'text' : 'password'}
                    value={sttApi.apiKey}
                    onChange={(e) => updateSTTConfig({ apiKey: e.target.value })}
                    placeholder={sttApi.provider === 'openai-whisper' ? 'sk-...' : '腾讯云 SecretId'}
                    className="w-full h-10 px-3 pr-10 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => setShowSttApiKey(!showSttApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    {showSttApiKey ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>
            )}

            {/* STT Base URL — 浏览器内置不需要 */}
            {sttApi.provider !== 'web-speech' && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  接口地址
                </label>
                <input
                  type="text"
                  value={sttApi.baseUrl}
                  onChange={(e) => updateSTTConfig({ baseUrl: e.target.value })}
                  placeholder={
                    sttApi.provider === 'openai-whisper'
                      ? 'https://api.openai.com/v1/audio/transcriptions'
                      : 'https://asr.tencentcloudapi.com'
                  }
                  className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
            <p className="text-xs text-gray-400">
              {sttApi.provider === 'web-speech'
                ? '浏览器内置方案免费无需 API Key，中文识别效果一般'
                : sttApi.provider === 'openai-whisper'
                  ? 'Whisper 识别准确率高，需要 OpenAI API Key'
                  : '腾讯云 ASR 中文效果最佳，需要腾讯云账号'}
            </p>
          </section>
        )}

        {/* ========== 自己配置模式：API 连通性测试 ========== */}
        {apiMode === 'local' && (
          <ApiTestPanel />
        )}

        {/* ========== 外观与语言 ========== */}
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

        {/* ========== 数据管理 ========== */}
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
