import { useState, useCallback, useRef } from 'react';
import { aiService } from '../services/aiService';
import { useConfigStore } from '../stores/configStore';

interface UseAIOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

/**
 * AI 对话 Hook（流式）
 * 封装流式 SSE 通信的状态管理
 * 自动根据配置选择本地直连或服务器代理模式
 */
export function useAI(options: UseAIOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (
      messages: Array<{ role: string; content: string }>,
      contextText?: string,
      modelOverride?: string,
    ) => {
      setIsStreaming(true);
      setStreamingContent('');
      setError(null);

      const { apiMode, localApi, serverApi } = useConfigStore.getState();
      let fullContent = '';

      try {
        if (apiMode === 'server' && serverApi.token) {
          // 服务器模式
          await aiService.streamChatServer(
            serverApi.baseUrl,
            serverApi.token,
            contextText || '',
            messages,
            modelOverride || 'gpt-4o',
            localApi.temperature,
            (chunk) => {
              fullContent += chunk;
              setStreamingContent(fullContent);
              options.onChunk?.(chunk);
            },
            (content) => {
              setIsStreaming(false);
              options.onComplete?.(content);
            },
            (err) => {
              setError(err);
              setIsStreaming(false);
              options.onError?.(err);
            },
          );
        } else {
          // 本地模式
          await aiService.streamChat(
            localApi,
            contextText || '',
            messages,
            (chunk) => {
              fullContent += chunk;
              setStreamingContent(fullContent);
              options.onChunk?.(chunk);
            },
            (content) => {
              setIsStreaming(false);
              options.onComplete?.(content);
            },
            (err) => {
              setError(err);
              setIsStreaming(false);
              options.onError?.(err);
            },
          );
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setError(err as Error);
          options.onError?.(err as Error);
        }
        setIsStreaming(false);
      }
    },
    [options],
  );

  const abort = useCallback(() => {
    aiService.abort();
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setStreamingContent('');
    setError(null);
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    abort,
    reset,
  };
}
