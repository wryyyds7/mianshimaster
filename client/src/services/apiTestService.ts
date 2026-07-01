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

    // ---- 调试：打印请求详情 ----
    console.log('[API测试] 请求URL:', endpoint);
    console.log('[API测试] 请求头:', JSON.stringify(headers, null, 2));
    console.log('[API测试] 请求体:', JSON.stringify(requestBody, null, 2));
    console.log('[API测试] 提供商:', provider, '适配器:', adapter.provider);

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
      console.log('[API测试] 失败响应体:', errorBody.slice(0, 500));
      return { success: false, latencyMs, message: errMsg, model: config.model, provider: config.provider };
    }

    const rawText = await response.text().catch(() => '');
    console.log('[API测试] 成功响应体(前500字符):', rawText.slice(0, 500));

    let data: unknown;
    try {
      data = JSON.parse(rawText);
    } catch {
      return {
        success: false,
        latencyMs,
        message: `响应不是有效 JSON: ${rawText.slice(0, 150)}`,
        model: config.model,
        provider: config.provider,
      };
    }

    // 适配器解析
    const content = adapter.parseResponse(data);

    // ---- 兜底：自适应解析常见格式 ----
    if (!content) {
      const fallback = smartParseContent(data);
      console.log('[API测试] 适配器解析为空，兜底解析结果:', fallback ? fallback.slice(0, 100) : '(空)');
      console.log('[API测试] 响应数据结构:', JSON.stringify(data).slice(0, 500));

      const rawSnippet = JSON.stringify(data).slice(0, 300);
      const modelSuggestion = buildModelSuggestion(provider, data);

      return {
        success: false,
        latencyMs,
        message: `API 返回了空内容。\n原始响应(截断): ${rawSnippet}${modelSuggestion}`,
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

// ============ 兜底智能解析 ============

/**
 * 当适配器 parseResponse 返回空时，尝试多种常见响应格式提取内容。
 * 用于兼容 API 代理、非标准接口等场景。
 */
function smartParseContent(data: unknown): string {
  const d = data as any;
  if (!d || typeof d !== 'object') return '';

  // 1) OpenAI 兼容 { choices: [{ message: { content } }] }
  const c1 = d?.choices?.[0]?.message?.content;
  if (c1) return String(c1);

  // 2) 裸 content / text 字段
  if (typeof d?.content === 'string') return d.content;
  if (typeof d?.text === 'string') return d.text;

  // 3) Gemini { candidates: [{ content: { parts: [{ text }] } }] }
  const parts = d?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const t = parts.map((p: any) => p.text || '').join('');
    if (t) return t;
  }

  // 4) Anthropic { content: [{ type: 'text', text: ... }] }
  if (Array.isArray(d?.content)) {
    const t = d.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');
    if (t) return t;
  }

  // 5) Ollama { message: { content } }
  if (d?.message?.content) return String(d.message.content);

  // 6) 嵌套在 data 字段内
  if (d?.data && typeof d.data === 'object') {
    return smartParseContent(d.data);
  }

  // 7) response / result 字段（某些代理）
  if (d?.response && typeof d.response === 'object') {
    return smartParseContent(d.response);
  }
  if (d?.result && typeof d.result === 'object') {
    return smartParseContent(d.result);
  }

  return '';
}

/**
 * 根据原始响应构建模型建议提示
 */
function buildModelSuggestion(provider: string, data: unknown): string {
  const d = data as any;
  // Gemini 特有: 若返回 candidates 为空或 safetyRatings 阻止
  if (d?.candidates && d.candidates.length === 0) {
    if (d?.promptFeedback?.blockReason) {
      return `\n[被阻止: ${d.promptFeedback.blockReason}]`;
    }
    return '\n[提示: candidates 为空，可能是安全过滤或模型不存在]';
  }
  // OpenAI 兼容: 若返回 error 信息但 HTTP 却是 200
  if (d?.error?.message) {
    return `\n[服务端错误: ${d.error.message}]`;
  }
  return '';
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
