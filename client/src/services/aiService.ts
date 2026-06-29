import type { IChatMessage, ILocalApiConfig } from '@shared/types';

interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onComplete: (fullContent: string) => void;
  onError: (error: Error) => void;
}

class AIService {
  private abortController: AbortController | null = null;

  // 流式对话
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
      const allMessages = [
        { role: 'system', content: systemContext || '你是一个专业的面试辅助AI，请根据上下文信息提供准确、有帮助的回答。' },
        ...messages,
      ];

      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: allMessages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          stream: true,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`AI API请求失败: ${response.status} ${response.statusText}`);
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
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            const content = data.choices?.[0]?.delta?.content;
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
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      onError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      this.abortController = null;
    }
  }

  // 取消当前请求
  abort(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  // 同步对话（非流式）
  async chat(
    config: ILocalApiConfig,
    systemContext: string,
    messages: Pick<IChatMessage, 'role' | 'content'>[],
  ): Promise<string> {
    const allMessages = [
      { role: 'system', content: systemContext },
      ...messages,
    ];

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: allMessages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

export const aiService = new AIService();
