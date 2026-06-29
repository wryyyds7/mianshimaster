import { useState, useCallback, useRef } from 'react';
import { aiService } from '../services/aiService';

interface UseAIOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

/**
 * AI 对话 Hook（流式）
 * 封装流式 SSE 通信的状态管理
 */
export function useAI(options: UseAIOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (messages: Array<{ role: string; content: string }>, config?: {
      model?: string;
      temperature?: number;
    }) => {
      setIsStreaming(true);
      setStreamingContent('');
      setError(null);

      const abortController = new AbortController();
      abortRef.current = abortController;

      let fullContent = '';

      try {
        await aiService.streamChat(
          messages,
          {
            onChunk: (chunk) => {
              fullContent += chunk;
              setStreamingContent(fullContent);
              options.onChunk?.(chunk);
            },
            onComplete: (content) => {
              setIsStreaming(false);
              options.onComplete?.(content);
            },
            onError: (err) => {
              setError(err);
              setIsStreaming(false);
              options.onError?.(err);
            },
            signal: abortController.signal,
          },
          config,
        );
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
    abortRef.current?.abort();
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
