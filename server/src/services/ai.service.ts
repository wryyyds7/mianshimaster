interface AIConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface AIResult {
  content: string;
  tokensUsed?: number;
}

export const aiService = {
  // 流式对话
  async streamChat(
    config: AIConfig,
    systemPrompt: string,
    messages: { role: string; content: string }[],
    onChunk: (chunk: string) => void,
    onComplete: (result: AIResult) => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    try {
      const allMessages = [
        { role: 'system', content: systemPrompt || '你是一个专业的AI助手。' },
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
      });

      if (!response.ok) {
        throw new Error(`AI API Error: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let tokenCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

        for (const line of lines) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);
            const content = data.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              tokenCount++;
              onChunk(content);
            }
          } catch { /* skip malformed lines */ }
        }
      }

      onComplete({ content: fullContent, tokensUsed: tokenCount });
    } catch (err) {
      onError(err as Error);
    }
  },

  // 同步对话
  async chat(
    config: AIConfig,
    systemPrompt: string,
    messages: { role: string; content: string }[],
  ): Promise<AIResult> {
    const allMessages = [
      { role: 'system', content: systemPrompt },
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
      throw new Error(`AI API Error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens,
    };
  },
};
