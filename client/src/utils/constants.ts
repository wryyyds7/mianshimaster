export const APP_NAME = '面试大师';
export const APP_VERSION = '1.0.0';

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
];

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.txt', '.md'];
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * 模型列表、提供商列表 —— 从 API 适配器注册表动态聚合
 * 新增提供商只需在 api-adapters/registry.ts 注册，此处自动同步。
 */
import { API_ADAPTERS, getDefaultModelForProvider } from '../services/api-adapters';

/** 提供商下拉选项 */
export const API_PROVIDERS = API_ADAPTERS.map(a => ({
  value: a.provider,
  label: a.label,
  baseUrl: a.baseUrl,
}));

/** 全部模型下拉选项（跨提供商聚合） */
export const DEFAULT_MODELS = API_ADAPTERS.flatMap(a =>
  a.models.map(m => ({
    value: m.value,
    label: m.label + (m.deprecated ? ' (弃用)' : ''),
    provider: a.provider,
  }))
);

/**
 * 根据当前提供商获取可选的模型列表
 * @param provider 当前选中的提供商
 */
export function getModelsForProvider(provider: string): typeof DEFAULT_MODELS {
  const p = provider === 'claude' ? 'anthropic' : provider;
  return DEFAULT_MODELS.filter(m => m.provider === p);
}

/**
 * 根据 provider 获取默认模型
 * 兼容旧版 provider='claude' → 映射为新版 'anthropic'
 */
export function getDefaultModel(provider: string): string {
  const p = provider === 'claude' ? 'anthropic' : provider;
  return getDefaultModelForProvider(p);
}
