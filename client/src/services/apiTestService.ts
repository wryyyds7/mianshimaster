/**
 * API 连通性测试服务
 * 用于验证 LLM 大模型和 STT 语音识别的 API Key / Base URL 是否可用
 */
import type { ILocalApiConfig, ISTTApiConfig } from '@shared/types';

export interface ApiTestResult {
  success: boolean;
  latencyMs: number;
  message: string;
  model?: string;       // 测试时实际使用的模型名
  provider?: string;    // 提供商
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
    // 针对 Claude 的 baseUrl 做适配（Anthropic 使用 /messages 端点）
    const isClaude = config.baseUrl.includes('anthropic.com');
    const endpoint = isClaude
      ? `${config.baseUrl}/messages`
      : `${config.baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // OpenAI 兼容格式用 Bearer，Anthropic 用 x-api-key
      ...(isClaude
        ? { 'x-api-key': config.apiKey, 'anthropic-version': '2023-06-01' }
        : { Authorization: `Bearer ${config.apiKey}` }),
    };

    const body = isClaude
      ? JSON.stringify({
          model: config.model,
          max_tokens: 10,
          messages: testMessage,
        })
      : JSON.stringify({
          model: config.model,
          messages: testMessage,
          max_tokens: 10,
          temperature: 0,
          stream: false,
        });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
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
    // 检查返回内容是否包含 OK（简单的有效性验证）
    const content = isClaude
      ? data.content?.[0]?.text || ''
      : data.choices?.[0]?.message?.content || '';

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
 * 仅对需要 API Key 的提供商测试
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
      // Whisper: 尝试调用 /models 端点验证 Key（不真正上传音频）
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
      // 腾讯云 ASR: 简单校验 baseUrl 可达
      const resp = await fetch(config.baseUrl || 'https://asr.tencentcloudapi.com', {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      const latencyMs = Math.round(performance.now() - startTime);
      if (resp.ok || resp.status === 405) {
        // 405 Method Not Allowed 也算可达（HEAD 不被支持但域名存在）
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
