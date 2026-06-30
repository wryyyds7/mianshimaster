/**
 * ============================================================
 * API 适配器类型定义
 * 
 * 每种大模型 API 提供商都有独特的请求/响应格式。
 * 本模块通过声明式配置，使系统能自动生成符合各 API 
 * 标准格式的完整请求代码，并正确解析响应。
 * ============================================================
 */

// ==================== 认证方式 ====================
export type AuthType =
  | 'bearer'          // Authorization: Bearer {apiKey}
  | 'x-api-key'       // x-api-key: {apiKey}  (Anthropic)
  | 'query-param'     // ?key={apiKey}  (Gemini alt)
  | 'x-goog-api-key'  // x-goog-api-key: {apiKey}  (Gemini via Vertex)
  | 'none';           // 本地运行，无认证 (Ollama)

// ==================== 请求构建参数 ====================
export interface RequestBuildParams {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  /** 额外参数（如 Anthropic 的 system, Thinking 的 reasoning_effort） */
  extra?: Record<string, unknown>;
}

// ==================== API 适配器接口 ====================
export interface IApiAdapter {
  /** 提供商唯一标识 */
  provider: string;
  /** 用户可见名称 */
  label: string;
  /** 默认 Base URL */
  baseUrl: string;
  /** 可选模型列表 */
  models: Array<{ value: string; label: string; deprecated?: boolean }>;
  /** 默认模型 */
  defaultModel: string;
  /** 认证方式 */
  authType: AuthType;

  /** 
   * 构建认证请求头
   * @param apiKey 用户的 API Key
   */
  buildAuthHeaders(apiKey: string): Record<string, string>;

  /** 
   * 构建请求端点 URL
   * @param baseUrl 用户配置的 baseUrl
   * @param model 模型名（Gemini 等部分 API 需要把模型嵌入 URL 路径）
   * @param stream 是否流式（Gemini 流式需要 :streamGenerateContent?alt=sse 后缀）
   */
  buildEndpoint(baseUrl: string, model?: string, stream?: boolean): string;

  /** 
   * 构建请求体 (JSON body)
   * @param params 请求参数
   */
  buildRequestBody(params: RequestBuildParams): Record<string, unknown>;

  /** 
   * 解析非流式响应，提取文本内容
   * @param responseData 响应的 JSON 对象
   */
  parseResponse(responseData: unknown): string;

  /** 
   * 解析流式响应 (SSE) 的单个 data chunk，提取增量文本
   * @param chunk 解析后的 JSON chunk 对象
   * @returns 增量文本，无内容返回 null
   */
  parseStreamChunk(chunk: unknown): string | null;

  /** 
   * SSE 流配置
   */
  streamConfig: {
    /** Content-Type 特征：用于识别流 */
    contentType: string;
    /** SSE 行前缀，如 'data: ' */
    linePrefix: string;
    /** 流结束标记，如 '[DONE]' */
    doneToken: string;
  };

  /** 
   * 生成配置展示用的结构化信息
   */
  describe(): ApiFormatDescription;
}

// ==================== 配置展示类型 ====================
export interface ApiFormatDescription {
  provider: string;
  label: string;
  endpoint: string;
  authType: string;
  authHeaderExample: string;
  requestHeaders: Record<string, string>;
  requestBodyExample: Record<string, unknown>;
  responseParsingCode: string;
  streamParsingCode: string;
  notes: string[];
}
