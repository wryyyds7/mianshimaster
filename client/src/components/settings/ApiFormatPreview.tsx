/**
 * API 格式预览面板
 * 
 * 当用户选择特定 API 提供商后，本组件自动展示该 API 的完整配置：
 * - 端点 URL
 * - 认证头/鉴权方式
 * - 请求体结构
 * - 响应解析逻辑
 * - 流式数据解析逻辑
 * 
 * 所有内容由适配器注册表动态生成，严格符合各 API 官方格式规范。
 */
import React from 'react';
import { getAdapter } from '../../services/api-adapters';
import type { ILocalApiConfig } from '@shared/types';
import { Eye, Code, Key, Globe, Send, ArrowRightLeft } from 'lucide-react';

interface Props {
  config: ILocalApiConfig;
}

export default function ApiFormatPreview({ config }: Props) {
  const provider = config.provider === 'claude' ? 'anthropic' : config.provider;
  const adapter = getAdapter(provider);

  // 生成实际的示例配置
  const desc = adapter?.describe();
  const endpoint = adapter?.buildEndpoint(config.baseUrl || adapter.baseUrl) || '';
  const authHeaders = adapter?.buildAuthHeaders('{your_api_key}') || {};
  const requestBody = adapter?.buildRequestBody({
    model: config.model || adapter.defaultModel,
    messages: [
      { role: 'system', content: '你是一个有帮助的AI助手。' },
      { role: 'user', content: '{用户消息}' },
    ],
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    stream: true,
  }) || {};

  if (!adapter) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center text-sm text-gray-400">
        选择提供商后将显示对应的 API 格式配置
      </div>
    );
  }

  const formatCode = (obj: Record<string, unknown>): string => {
    return JSON.stringify(obj, null, 2)
      .replace(/"(\{.*?\})"/g, '$1')  // 去除动态参数引号
      .replace(/\\"/g, '"');
  };

  const headerCode = () => {
    const lines = ["'Content-Type': 'application/json'"];
    for (const [key, value] of Object.entries(authHeaders)) {
      lines.push(`'${key}': '${value}'`);
    }
    return `{\n  ${lines.join(',\n  ')}\n}`;
  };

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Eye className="w-5 h-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          API 格式预览 — {desc?.label}
        </h2>
        <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
          自动生成
        </span>
      </div>

      {/* 认证方式 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-amber-500" />
          认证方式 ({desc?.authType})
        </h3>
        <pre className="bg-gray-900 text-green-400 text-xs p-3 rounded-lg overflow-x-auto font-mono leading-relaxed">
          {headerCode()}
        </pre>
        <p className="text-xs text-gray-400">{desc?.authHeaderExample}</p>
      </div>

      {/* 端点和请求头 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          请求端点
        </h3>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded font-semibold">POST</span>
          <span className="text-gray-600 dark:text-gray-400 break-all">{endpoint}</span>
        </div>
      </div>

      {/* 请求体 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Send className="w-3.5 h-3.5 text-emerald-500" />
          请求体 (JSON Body)
        </h3>
        <pre className="bg-gray-900 text-blue-300 text-xs p-3 rounded-lg overflow-x-auto font-mono leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
          {formatCode(requestBody)}
        </pre>
      </div>

      {/* 响应解析 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Code className="w-3.5 h-3.5 text-purple-500" />
          响应解析代码
        </h3>
        <pre className="bg-gray-900 text-yellow-300 text-xs p-3 rounded-lg overflow-x-auto font-mono leading-relaxed">
          {desc?.responseParsingCode}
        </pre>
      </div>

      {/* 流式解析 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <ArrowRightLeft className="w-3.5 h-3.5 text-rose-500" />
          流式 (SSE/NDJSON) 解析代码
        </h3>
        <pre className="bg-gray-900 text-cyan-300 text-xs p-3 rounded-lg overflow-x-auto font-mono leading-relaxed">
          {desc?.streamParsingCode}
        </pre>
      </div>

      {/* 注意事项 */}
      {desc?.notes && desc.notes.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">注意事项</h3>
          <ul className="space-y-1">
            {desc.notes.map((note, i) => (
              <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                <span className="text-amber-500 mt-0.5">•</span>
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
