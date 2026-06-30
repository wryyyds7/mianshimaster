import type { IChatMessage, ILocalApiConfig, IChatRequest } from '@shared/types';
import { getAdapter } from './api-adapters';

class AIService {
  private abortController: AbortController | null = null;

  // ========== 本地模式：直连AI API（适配器驱动）==========
  async streamChat(
    config: ILocalApiConfig,
    systemContext: string,
    messages: Pick<IChatMessage, 'role' | 'content'>[],
    onChunk: (chunk: string) => void,
    onComplete: (fullContent: string) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      // 获取适配器，claude 是旧版 provider 名，映射到 anthropic
      const provider = config.provider === 'claude' ? 'anthropic' : config.provider;
      const adapter = getAdapter(provider);
      if (!adapter) throw new Error(`不支持的 API 提供商: ${provider}`);

      const allMessages = [
        { role: 'system', content: systemContext || '你是一个专业的面试辅助AI，请根据上下文信息提供准确、有帮助的回答。' },
        ...messages,
      ];

      // 适配器自动构建请求
      const requestBody = adapter.buildRequestBody({
        model: config.model,
        messages: allMessages,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        stream: true,
      });

      const authHeaders = adapter.buildAuthHeaders(config.apiKey);
      const endpoint = adapter.buildEndpoint(config.baseUrl);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`AI API请求失败: ${response.status} ${errText.slice(0, 200)}`);
      }

      // 根据适配器配置选择流式解析策略
      const { linePrefix, doneToken, contentType } = adapter.streamConfig;

      if (contentType === 'application/x-ndjson') {
        // Ollama NDJSON 格式：每行一个完整 JSON
        await this.readNdjsonStream(response, adapter, onChunk, onComplete);
      } else if (doneToken === '') {
        // Gemini/Claude 无 done token 的 SSE
        await this.readSSEStreamWithoutDone(response, adapter, linePrefix, onChunk, onComplete);
      } else {
        // OpenAI/DeepSeek 有 [DONE] 标记的标准 SSE
        await this.readSSEStream(response, adapter, linePrefix, doneToken, onChunk, onComplete);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      onError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      this.abortController = null;
    }
  }

  // ========== 服务器模式：通过服务器代理调用AI ==========
  async streamChatServer(
    serverBaseUrl: string,
    token: string,
    systemContext: string,
    messages: Pick<IChatMessage, 'role' | 'content'>[],
    model: string,
    temperature: number,
    onChunk: (chunk: string) => void,
    onComplete: (fullContent: string) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${serverBaseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          model,
          temperature,
          messages: [
            { role: 'system', content: systemContext || '你是一个专业的面试辅助AI，请根据上下文信息提供准确、有帮助的回答。' },
            ...messages,
          ],
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`服务器AI请求失败: ${response.status} ${response.statusText}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

        for (const line of lines) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'chunk' && data.content) {
              fullText += data.content;
              onChunk(fullText);
            } else if (data.type === 'done') {
              fullText = data.content || fullText;
              onComplete(fullText);
              return;
            } else if (data.type === 'error') {
              throw new Error(data.message || '服务器AI请求错误');
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message.includes('服务器')) {
              throw parseErr;
            }
          }
        }
      }

      onComplete(fullText);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      onError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      this.abortController = null;
    }
  }

  // ========== 服务器模式：同步AI对话 ==========
  async chatServer(
    serverBaseUrl: string,
    token: string,
    systemContext: string,
    messages: Pick<IChatMessage, 'role' | 'content'>[],
    model: string,
    temperature: number,
  ): Promise<string> {
    const response = await fetch(`${serverBaseUrl}/api/ai/chat/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          { role: 'system', content: systemContext },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`服务器AI请求失败: ${response.status}`);
    }

    const result = await response.json();
    return result.data?.content || '';
  }

  // 取消当前请求
  abort(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  // ========== 同步对话（本地模式，非流式，适配器驱动）==========
  async chat(
    config: ILocalApiConfig,
    systemContext: string,
    messages: Pick<IChatMessage, 'role' | 'content'>[],
  ): Promise<string> {
    const provider = config.provider === 'claude' ? 'anthropic' : config.provider;
    const adapter = getAdapter(provider);
    if (!adapter) throw new Error(`不支持的 API 提供商: ${provider}`);

    const allMessages = [
      { role: 'system', content: systemContext },
      ...messages,
    ];

    const requestBody = adapter.buildRequestBody({
      model: config.model,
      messages: allMessages,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      stream: false,
    });

    const authHeaders = adapter.buildAuthHeaders(config.apiKey);
    const endpoint = adapter.buildEndpoint(config.baseUrl);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`AI API请求失败: ${response.status} ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    return adapter.parseResponse(data);
  }

  // ========== 流式读取策略 ==========

  /** 标准 SSE 流（OpenAI/DeepSeek/Moonshot） */
  private async readSSEStream(
    response: Response,
    adapter: ReturnType<typeof getAdapter>,
    linePrefix: string,
    doneToken: string,
    onChunk: (chunk: string) => void,
    onComplete: (fullContent: string) => void,
  ): Promise<void> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((line) => line.startsWith(linePrefix));

      for (const line of lines) {
        const jsonStr = line.slice(linePrefix.length).trim();
        if (jsonStr === doneToken) continue;
        if (!jsonStr) continue;

        try {
          const data = JSON.parse(jsonStr);
          const content = adapter!.parseStreamChunk(data);
          if (content) {
            fullText += content;
            onChunk(fullText);
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }

    onComplete(fullText);
  }

  /** SSE 流（无 [DONE] 标记，如 Gemini/Claude） */
  private async readSSEStreamWithoutDone(
    response: Response,
    adapter: ReturnType<typeof getAdapter>,
    linePrefix: string,
    onChunk: (chunk: string) => void,
    onComplete: (fullContent: string) => void,
  ): Promise<void> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((line) => line.startsWith(linePrefix));

      for (const line of lines) {
        const jsonStr = line.slice(linePrefix.length).trim();
        if (!jsonStr) continue;

        try {
          const data = JSON.parse(jsonStr);
          const content = adapter!.parseStreamChunk(data);
          if (content) {
            fullText += content;
            onChunk(fullText);
          }
        } catch {
          // 跳过
        }
      }
    }

    onComplete(fullText);
  }

  /** NDJSON 流（Ollama） */
  private async readNdjsonStream(
    response: Response,
    adapter: ReturnType<typeof getAdapter>,
    onChunk: (chunk: string) => void,
    onComplete: (fullContent: string) => void,
  ): Promise<void> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // 最后一行可能不完整，保留在 buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);
          const content = adapter!.parseStreamChunk(data);
          if (content) {
            fullText += content;
            onChunk(fullText);
          }
        } catch {
          // 跳过无法解析的行
        }
      }
    }

    // 处理最后残留的 buffer
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        const content = adapter!.parseStreamChunk(data);
        if (content) {
          fullText += content;
          onChunk(fullText);
        }
      } catch { /* skip */ }
    }

    onComplete(fullText);
  }
}

export const aiService = new AIService();
