/**
 * API 连通性测试服务
 * 用于验证 LLM 大模型和 STT 语音识别的 API Key / Base URL 是否可用
 * 
 * 使用 API 适配器系统自动生成符合各提供商格式规范的测试请求
 */
import type { ILocalApiConfig, ISTTApiConfig } from '@shared/types';
import { getAdapter } from './api-adapters';

export interface ApiTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  model?: string;
  provider?: string;
}

export interface SttTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  provider: string;
}

/**
 * 测试 LLM API 连通性
 * 发送一个简单的非流式请求（"回复OK"），检查能否正常返回
 */
export async function testLlmApi(config: ILocalApiConfig): Promise<ApiTestResult> {
  const startTime = performance.now();
  const testMessage = [{ role: 'user' as const, content: '请回复两个字：OK' }];

  try {
    // 使用适配器自动生成完整请求配置
    const provider = config.provider === 'claude' ? 'anthropic' : config.provider;
    const adapter = getAdapter(provider);
    if (!adapter) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false, latencyMs,
        message: `不支持的提供商: ${provider}`,
        model: config.model, provider: config.provider,
      };
    }

    const endpoint = adapter.buildEndpoint(config.baseUrl, config.model);
    const authHeaders = adapter.buildAuthHeaders(config.apiKey);
    const requestBody = adapter.buildRequestBody({
      model: config.model,
      messages: testMessage,
      maxTokens: 10,
      temperature: 0,
      stream: false,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000),
    });

    const latencyMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      let errMsg = `HTTP ${response.status}`;
      if (response.status === 401) errMsg = 'API Key 无效（401 Unauthorized）';
      else if (response.status === 403) errMsg = 'API Key 无权限（403 Forbidden）';
      else if (response.status === 404) errMsg = '接口地址错误（404 Not Found）';
      else if (response.status === 429) errMsg = '请求频率超限（429 Too Many Requests）';
      else if (response.status === 405) errMsg = '接口不支持（405 Method Not Allowed），请检查 Base URL';
      else {
        try {
          const json = JSON.parse(errorBody);
          errMsg = json.error?.message || `HTTP ${response.status}`;
        } catch {
          errMsg = `HTTP ${response.status}: ${errorBody.slice(0, 100)}`;
        }
      }
      return { success: false, latencyMs, message: errMsg, model: config.model, provider: config.provider };
    }

    const data = await response.json();
    const content = adapter.parseResponse(data);

    if (!content) {
      return {
        success: false,
        latencyMs,
        message: 'API 返回了空内容，请检查模型名称是否正确',
        model: config.model,
        provider: config.provider,
      };
    }

    return {
      success: true,
      latencyMs,
      message: `连接成功 · 延迟 ${latencyMs}ms · 模型 ${config.model}`,
      model: config.model,
      provider: config.provider,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return { success: false, latencyMs, message: '连接超时（15秒），请检查 Base URL 是否正确', model: config.model, provider: config.provider };
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, latencyMs, message: '请求被取消', model: config.model, provider: config.provider };
    }
    if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
      return { success: false, latencyMs, message: '网络连接失败，请检查 Base URL 和网络', model: config.model, provider: config.provider };
    }
    return {
      success: false,
      latencyMs,
      message: `连接错误: ${err instanceof Error ? err.message : String(err)}`,
      model: config.model,
      provider: config.provider,
    };
  }
}

/**
 * 测试 STT 语音识别 API 连通性
 */
export async function testSttApi(config: ISTTApiConfig): Promise<SttTestResult> {
  const startTime = performance.now();

  if (config.provider === 'web-speech') {
    return {
      success: true,
      latencyMs: 0,
      message: '浏览器内置语音识别（无需 API Key）',
      provider: config.provider,
    };
  }

  try {
    if (config.provider === 'openai-whisper') {
      const resp = await fetch(`${config.baseUrl || 'https://api.openai.com/v1'}/models`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        signal: AbortSignal.timeout(10000),
      });
      const latencyMs = Math.round(performance.now() - startTime);
      if (resp.ok) {
        return { success: true, latencyMs, message: 'Whisper API 连接正常', provider: config.provider };
      }
      if (resp.status === 401) {
        return { success: false, latencyMs, message: 'Whisper API Key 无效', provider: config.provider };
      }
      return { success: false, latencyMs, message: `HTTP ${resp.status}`, provider: config.provider };
    }

    if (config.provider === 'tencent-asr') {
      const resp = await fetch(config.baseUrl || 'https://asr.tencentcloudapi.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      const latencyMs = Math.round(performance.now() - startTime);
      if (resp.ok || resp.status === 405) {
        return { success: true, latencyMs, message: '腾讯云 ASR 接口可达', provider: config.provider };
      }
      return { success: false, latencyMs, message: `HTTP ${resp.status}`, provider: config.provider };
    }

    return { success: false, latencyMs: 0, message: '未知的 STT 提供商', provider: config.provider };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return { success: false, latencyMs, message: '超时，请检查接口地址', provider: config.provider };
    }
    return {
      success: false,
      latencyMs,
      message: `连接失败: ${err instanceof Error ? err.message : String(err)}`,
      provider: config.provider,
    };
  }
}

/**
 * 一键测试全部 API（LLM + STT）
 */
export async function testAllApis(
  llmConfig: ILocalApiConfig,
  sttConfig: ISTTApiConfig,
): Promise<{ llm: ApiTestResult; stt: SttTestResult }> {
  const [llm, stt] = await Promise.all([
    testLlmApi(llmConfig),
    testSttApi(sttConfig),
  ]);
  return { llm, stt };
}
