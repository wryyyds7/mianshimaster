/**
 * API 适配器模块统一导出
 * 
 * 使用方式:
 * import { getAdapter, generateApiConfig, API_ADAPTERS } from '@/services/api-adapters';
 * 
 * const adapter = getAdapter('gemini');
 * adapter.buildAuthHeaders(myKey);
 * adapter.buildRequestBody({ model: 'gemini-pro', messages: [...] });
 */
export * from './types';
export * from './registry';
