/**
 * ============================================================
 * API 提供商注册表 (Provider Registry)
 * 
 * 包含各大主流 LLM API 的完整请求/响应格式规范。
 * 每新增一个提供商，只需在此添加一个配置对象，
 * 系统将自动生成对应的请求头、鉴权、请求体和响应解析逻辑。
 * ============================================================
 */
import type {
  IApiAdapter,
  RequestBuildParams,
} from './types';

// ==================== 辅助函数 ====================

/** 通用 Bearer 认证头 */
function bearerHeaders(apiKey: string): Record<string, string> {
  return { Authorization: `Bearer ${apiKey}` };
}

/** 通用 OpenAI 响应解析 */
function parseOpenAIResponse(data: unknown): string {
  const d = data as Record<string, unknown>;
  return (d as any)?.choices?.[0]?.message?.content || '';
}

/** 通用 OpenAI SSE chunk 解析 */
function parseOpenAIStreamChunk(chunk: unknown): string | null {
  const c = chunk as Record<string, unknown>;
  return (c as any)?.choices?.[0]?.delta?.content || null;
}

/** 构建 OpenAI 兼容请求体 */
function buildOpenAIRequestBody(params: RequestBuildParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: params.model,
    messages: params.messages,
    stream: params.stream ?? false,
  };
  if (params.temperature !== undefined) body.temperature = params.temperature;
  if (params.maxTokens !== undefined) body.max_tokens = params.maxTokens;
  // 传递额外参数（如 DeepSeek 的 thinking/reasoning_effort）
  if (params.extra) {
    Object.assign(body, params.extra);
  }
  return body;
}

// ==================== 提供商定义 ====================

/**
 * OpenAI (GPT 系列)
 * 参考文档: https://platform.openai.com/docs/api-reference/chat
 */
const openaiAdapter: IApiAdapter = {
  provider: 'openai',
  label: 'OpenAI',
  baseUrl: 'https://api.openai.com/v1',
  models: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  defaultModel: 'gpt-4o',
  authType: 'bearer',

  buildAuthHeaders: bearerHeaders,

  buildEndpoint(baseUrl: string) {
    return `${baseUrl}/chat/completions`;
  },

  buildRequestBody: buildOpenAIRequestBody,

  parseResponse: parseOpenAIResponse,

  parseStreamChunk: parseOpenAIStreamChunk,

  streamConfig: {
    contentType: 'text/event-stream',
    linePrefix: 'data: ',
    doneToken: '[DONE]',
  },

  describe() {
    return {
      provider: 'openai',
      label: 'OpenAI',
      endpoint: `${this.baseUrl}/chat/completions`,
      authType: 'Bearer Token',
      authHeaderExample: 'Authorization: Bearer sk-...',
      requestHeaders: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {apiKey}',
      },
      requestBodyExample: {
        model: 'gpt-4o',
        messages: [{ role: 'system', content: '...' }, { role: 'user', content: '...' }],
        temperature: 0.7,
        max_tokens: 4096,
        stream: true,
      },
      responseParsingCode: `// 非流式响应解析
const data = await response.json();
const content = data.choices[0].message.content;`,
      streamParsingCode: `// SSE 流式解析
const line = 'data: {"choices":[{"delta":{"content":"你好"}}]}';
const json = JSON.parse(line.slice(6));
const text = json.choices[0].delta.content;`,
      notes: ['所有 OpenAI 兼容接口（DeepSeek/Moonshot/智谱等）均采用此格式', '流式输出使用 Server-Sent Events (SSE)'],
    };
  },
};

/**
 * Anthropic Claude
 * 参考文档: https://docs.anthropic.com/en/api/messages
 */
const anthropicAdapter: IApiAdapter = {
  provider: 'anthropic',
  label: 'Anthropic Claude',
  baseUrl: 'https://api.anthropic.com/v1',
  models: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
  ],
  defaultModel: 'claude-sonnet-4-20250514',
  authType: 'x-api-key',

  buildAuthHeaders(apiKey: string) {
    return {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    };
  },

  buildEndpoint(baseUrl: string) {
    return `${baseUrl}/messages`;
  },

  buildRequestBody(params: RequestBuildParams) {
    // Claude 格式：分离 system 消息，其余为 messages
    const systemMsg = params.messages.find(m => m.role === 'system');
    const chatMessages = params.messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model: params.model,
      max_tokens: params.maxTokens || 4096,
      messages: chatMessages,
      stream: params.stream ?? false,
    };
    if (systemMsg) body.system = systemMsg.content;
    if (params.temperature !== undefined) body.temperature = params.temperature;
    if (params.extra) Object.assign(body, params.extra);
    return body;
  },

  parseResponse(data: unknown): string {
    const d = data as Record<string, unknown>;
    const content = (d as any)?.content;
    if (Array.isArray(content)) {
      return content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('');
    }
    return '';
  },

  parseStreamChunk(chunk: unknown): string | null {
    const c = chunk as Record<string, unknown>;
    // Claude 流式事件: content_block_delta / content_block_start
    if (c.type === 'content_block_delta') {
      return (c.delta as any)?.text || null;
    }
    if (c.type === 'content_block_start') {
      return (c.content_block as any)?.text || null;
    }
    return null;
  },

  streamConfig: {
    contentType: 'text/event-stream',
    linePrefix: 'data: ',
    doneToken: '',  // Claude 用 type: 'message_stop' 事件标记结束
  },

  describe() {
    return {
      provider: 'anthropic',
      label: 'Anthropic Claude',
      endpoint: `${this.baseUrl}/messages`,
      authType: 'x-api-key Header',
      authHeaderExample: 'x-api-key: sk-ant-...',
      requestHeaders: {
        'Content-Type': 'application/json',
        'x-api-key': '{apiKey}',
        'anthropic-version': '2023-06-01',
      },
      requestBodyExample: {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: '你是一个有帮助的助手',
        messages: [{ role: 'user', content: '你好' }],
        stream: true,
      },
      responseParsingCode: `// 非流式响应解析
const data = await response.json();
const content = data.content
  .filter(b => b.type === 'text')
  .map(b => b.text)
  .join('');`,
      streamParsingCode: `// SSE 流式解析
const json = JSON.parse(line.slice(6));
if (json.type === 'content_block_delta') {
  const text = json.delta.text;
}`,
      notes: [
        'system 消息独立于 messages 数组',
        'messages 中不允许 role=system',
        '流式结束由 message_stop 事件标记',
      ],
    };
  },
};

/**
 * DeepSeek (OpenAI 兼容 + 思考模式扩展)
 * 参考文档: https://api-docs.deepseek.com/
 */
const deepseekAdapter: IApiAdapter = {
  provider: 'deepseek',
  label: 'DeepSeek',
  baseUrl: 'https://api.deepseek.com',
  models: [
    { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
    { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
    { value: 'deepseek-chat', label: 'DeepSeek Chat (弃用)', deprecated: true },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (弃用)', deprecated: true },
  ],
  defaultModel: 'deepseek-v4-flash',
  authType: 'bearer',

  buildAuthHeaders: bearerHeaders,

  buildEndpoint(baseUrl: string) {
    return `${baseUrl}/chat/completions`;
  },

  // DeepSeek 使用 OpenAI 兼容格式，但支持额外的 thinking/reasoning_effort 参数
  buildRequestBody(params: RequestBuildParams) {
    const body = buildOpenAIRequestBody(params);
    // DeepSeek V4 Pro 支持思考模式参数
    if (params.extra) {
      Object.assign(body, params.extra);
    }
    return body;
  },

  parseResponse: parseOpenAIResponse,

  parseStreamChunk: parseOpenAIStreamChunk,

  streamConfig: {
    contentType: 'text/event-stream',
    linePrefix: 'data: ',
    doneToken: '[DONE]',
  },

  describe() {
    return {
      provider: 'deepseek',
      label: 'DeepSeek',
      endpoint: `${this.baseUrl}/chat/completions`,
      authType: 'Bearer Token',
      authHeaderExample: 'Authorization: Bearer sk-...',
      requestHeaders: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {apiKey}',
      },
      requestBodyExample: {
        model: 'deepseek-v4-pro',
        messages: [{ role: 'system', content: '你是一个有帮助的助手' }, { role: 'user', content: '你好' }],
        temperature: 0.7,
        max_tokens: 4096,
        stream: false,
        thinking: { type: 'enabled' },
        reasoning_effort: 'high',
      },
      responseParsingCode: `// 非流式响应解析 (与 OpenAI 完全相同)
const data = await response.json();
const content = data.choices[0].message.content;
// 如果有思考过程:
// const reasoning = data.choices[0].message.reasoning_content;`,
      streamParsingCode: `// SSE 流式解析 (与 OpenAI 完全相同)
const json = JSON.parse(line.slice(6));
const text = json.choices[0].delta.content;
// 思考过程 (仅 V4 Pro):
// const reasoning = json.choices[0].delta.reasoning_content;`,
      notes: [
        '采用 OpenAI 兼容格式，SDK 可直接复用',
        'baseUrl 末尾不要带 /v1',
        'V4 Pro 支持 thinking 和 reasoning_effort 参数',
        '响应中 reasoning_content 字段包含思考过程',
      ],
    };
  },
};

/**
 * Google Gemini
 * 参考文档: https://ai.google.dev/api/generate-content
 */
const geminiAdapter: IApiAdapter = {
  provider: 'gemini',
  label: 'Google Gemini',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  models: [
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ],
  defaultModel: 'gemini-2.5-flash',
  authType: 'bearer',  // Gemini 也支持 Bearer (https://ai.google.dev/gemini-api/docs/oauth)

  buildAuthHeaders(apiKey: string) {
    return { Authorization: `Bearer ${apiKey}` };
  },

  // 备用认证：query-param 方式 (x-goog-api-key 或 ?key=)
  buildEndpoint(baseUrl: string) {
    return `${baseUrl}/models`;
  },

  buildRequestBody(params: RequestBuildParams) {
    // Gemini 格式：contents 数组，每个 content 有 role 和 parts
    const contents = params.messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: params.temperature ?? 0.7,
        maxOutputTokens: params.maxTokens ?? 4096,
      },
    };

    // 系统提示词：Gemini 用 systemInstruction
    const systemMsg = params.messages.find(m => m.role === 'system');
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
      // 从 contents 中移除 system（上面已全部加入，需要过滤）
      (body as any).contents = contents.filter((_: any, i: number) => params.messages[i].role !== 'system');
    }

    return body;
  },

  parseResponse(data: unknown): string {
    const d = data as Record<string, unknown>;
    const candidates = (d as any)?.candidates;
    if (Array.isArray(candidates) && candidates.length > 0) {
      const parts = candidates[0]?.content?.parts;
      if (Array.isArray(parts)) {
        return parts.map((p: any) => p.text || '').join('');
      }
    }
    return '';
  },

  parseStreamChunk(chunk: unknown): string | null {
    const c = chunk as Record<string, unknown>;
    const candidates = (c as any)?.candidates;
    if (Array.isArray(candidates) && candidates.length > 0) {
      const parts = candidates[0]?.content?.parts;
      if (Array.isArray(parts)) {
        return parts.map((p: any) => p.text || '').join('') || null;
      }
    }
    return null;
  },

  streamConfig: {
    contentType: 'text/event-stream',
    linePrefix: 'data: ',
    doneToken: '',  // Gemini 无 [DONE] 标记
  },

  describe() {
    return {
      provider: 'gemini',
      label: 'Google Gemini',
      endpoint: `${this.baseUrl}/models/{model}:streamGenerateContent?alt=sse`,
      authType: 'Bearer Token 或 API Key',
      authHeaderExample: 'Authorization: Bearer {apiKey}',
      requestHeaders: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {apiKey}',
      },
      requestBodyExample: {
        systemInstruction: { parts: [{ text: '你是一个有帮助的助手' }] },
        contents: [{ role: 'user', parts: [{ text: '你好' }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      },
      responseParsingCode: `// 非流式响应解析
const data = await response.json();
const text = data.candidates[0].content.parts
  .map(p => p.text)
  .join('');`,
      streamParsingCode: `// SSE 流式解析
const json = JSON.parse(line.slice(6));
const parts = json.candidates[0].content.parts;
const text = parts.map(p => p.text).join('');`,
      notes: [
        'assistant 角色需转换为 model',
        'system 提示词使用 systemInstruction 字段',
        '流式端点需加 ?alt=sse 参数',
        '非流式端点: /models/{model}:generateContent',
        '流式端点: /models/{model}:streamGenerateContent?alt=sse',
      ],
    };
  },
};

/**
 * Ollama (本地运行)
 * 参考文档: https://github.com/ollama/ollama/blob/main/docs/api.md
 */
const ollamaAdapter: IApiAdapter = {
  provider: 'ollama',
  label: 'Ollama (本地)',
  baseUrl: 'http://localhost:11434',
  models: [
    { value: 'llama3.1', label: 'Llama 3.1' },
    { value: 'qwen3', label: 'Qwen 3' },
    { value: 'deepseek-r1', label: 'DeepSeek R1 (本地)' },
    { value: 'mistral', label: 'Mistral' },
    { value: 'custom', label: '自定义模型' },
  ],
  defaultModel: 'llama3.1',
  authType: 'none',

  buildAuthHeaders(_apiKey: string) {
    return {};  // Ollama 本地运行，无需认证
  },

  buildEndpoint(baseUrl: string) {
    return `${baseUrl}/api/chat`;
  },

  buildRequestBody(params: RequestBuildParams) {
    const body: Record<string, unknown> = {
      model: params.model,
      messages: params.messages,
      stream: params.stream ?? false,
      options: {
        temperature: params.temperature ?? 0.7,
      },
    };
    if (params.maxTokens !== undefined) {
      (body.options as any).num_predict = params.maxTokens;
    }
    return body;
  },

  parseResponse(data: unknown): string {
    const d = data as Record<string, unknown>;
    return (d as any)?.message?.content || '';
  },

  parseStreamChunk(chunk: unknown): string | null {
    const c = chunk as Record<string, unknown>;
    return (c as any)?.message?.content || null;
  },

  streamConfig: {
    contentType: 'application/x-ndjson',  // Ollama 流式用 NDJSON
    linePrefix: '',    // 每行直接是 JSON
    doneToken: '',     // done: true 在消息体内
  },

  describe() {
    return {
      provider: 'ollama',
      label: 'Ollama (本地)',
      endpoint: `${this.baseUrl}/api/chat`,
      authType: '无 (本地运行)',
      authHeaderExample: '无需认证',
      requestHeaders: {
        'Content-Type': 'application/json',
      },
      requestBodyExample: {
        model: 'llama3.1',
        messages: [{ role: 'user', content: '你好' }],
        stream: false,
        options: { temperature: 0.7, num_predict: 4096 },
      },
      responseParsingCode: `// 非流式响应解析
const data = await response.json();
const content = data.message.content;`,
      streamParsingCode: `// NDJSON 流式解析 (每行一个完整 JSON)
const json = JSON.parse(line);
const text = json.message.content;`,
      notes: [
        '本地运行，无需 API Key',
        '流式使用 NDJSON 格式，非 SSE',
        'maxTokens 对应 options.num_predict',
        '需先运行 ollama serve 启动服务',
      ],
    };
  },
};

/**
 * 月之暗面 Moonshot / Kimi
 * 参考文档: https://platform.moonshot.cn/docs/
 */
const moonshotAdapter: IApiAdapter = {
  provider: 'moonshot',
  label: '月之暗面 Kimi',
  baseUrl: 'https://api.moonshot.cn/v1',
  models: [
    { value: 'moonshot-v1-8k', label: 'Moonshot v1 8K' },
    { value: 'moonshot-v1-32k', label: 'Moonshot v1 32K' },
    { value: 'moonshot-v1-128k', label: 'Moonshot v1 128K' },
    { value: 'kimi-latest', label: 'Kimi (最新)' },
  ],
  defaultModel: 'kimi-latest',
  authType: 'bearer',

  buildAuthHeaders: bearerHeaders,

  buildEndpoint(baseUrl: string) {
    return `${baseUrl}/chat/completions`;
  },

  buildRequestBody: buildOpenAIRequestBody,

  parseResponse: parseOpenAIResponse,

  parseStreamChunk: parseOpenAIStreamChunk,

  streamConfig: {
    contentType: 'text/event-stream',
    linePrefix: 'data: ',
    doneToken: '[DONE]',
  },

  describe() {
    return {
      provider: 'moonshot',
      label: '月之暗面 Kimi',
      endpoint: `${this.baseUrl}/chat/completions`,
      authType: 'Bearer Token',
      authHeaderExample: 'Authorization: Bearer sk-...',
      requestHeaders: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {apiKey}',
      },
      requestBodyExample: {
        model: 'kimi-latest',
        messages: [{ role: 'system', content: '...' }, { role: 'user', content: '...' }],
        temperature: 0.3,
        max_tokens: 4096,
        stream: true,
      },
      responseParsingCode: `// 与 OpenAI 格式完全相同
const data = await response.json();
const content = data.choices[0].message.content;`,
      streamParsingCode: `// 与 OpenAI 格式完全相同
const json = JSON.parse(line.slice(6));
const text = json.choices[0].delta.content;`,
      notes: [
        '采用标准 OpenAI 兼容格式',
        '支持最长 128K 上下文',
        'Temperature 建议 0.3',
      ],
    };
  },
};

// ==================== 注册表 ====================

/** 全部已注册的 API 适配器 */
export const API_ADAPTERS: IApiAdapter[] = [
  openaiAdapter,
  anthropicAdapter,
  deepseekAdapter,
  geminiAdapter,
  ollamaAdapter,
  moonshotAdapter,
];

/** 按 provider 名快速查找适配器 */
export function getAdapter(provider: string): IApiAdapter | undefined {
  return API_ADAPTERS.find(a => a.provider === provider);
}

/** 获取用于 UI 下拉选择的提供商列表 */
export function getProviderOptions() {
  return API_ADAPTERS.map(a => ({
    value: a.provider,
    label: a.label,
    baseUrl: a.baseUrl,
    defaultModel: a.defaultModel,
  }));
}

/** 根据 provider 获取模型列表（含弃用标记） */
export function getModelsForProvider(provider: string) {
  const adapter = getAdapter(provider);
  return adapter?.models || [{ value: 'custom', label: '自定义模型' }];
}

/** 根据 provider 获取默认模型 */
export function getDefaultModelForProvider(provider: string): string {
  const adapter = getAdapter(provider);
  return adapter?.defaultModel || 'custom';
}

/** 
 * 根据 provider 名称，适配器自动生成完整配置。
 * 这是核心 API：当用户选择提供商后，可一键获得所有所需配置。
 */
export function generateApiConfig(provider: string, apiKey: string) {
  const adapter = getAdapter(provider);
  if (!adapter) {
    throw new Error(`未知的 API 提供商: ${provider}`);
  }
  return {
    provider: adapter.provider,
    baseUrl: adapter.baseUrl,
    defaultModel: adapter.defaultModel,
    models: adapter.models,
    authHeaders: adapter.buildAuthHeaders(apiKey),
    description: adapter.describe(),
  };
}

/** 检查 provider 是否为 OpenAI 兼容格式 */
export function isOpenAICompatible(provider: string): boolean {
  return ['openai', 'deepseek', 'moonshot'].includes(provider);
}

/** 检查 provider 是否使用 SSE 流式 */
export function usesSSEStreaming(provider: string): boolean {
  const adapter = getAdapter(provider);
  return adapter?.streamConfig.contentType === 'text/event-stream';
}
