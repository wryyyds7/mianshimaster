/**
 * useAgent Hook —— React 桥接层
 * 
 * 将 InterviewAgent 的纯逻辑层接入 React 状态管理
 * 负责：
 * 1. 订阅 Agent 事件并同步到 React state
 * 2. 管理 Agent 生命周期（组件卸载时自动 reset）
 * 3. 提供便捷的 React API
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { interviewAgent } from '../agent/InterviewAgent';
import type {
  AgentState,
  IAgentConfig,
  IAgentMessage,
  IAgentResponse,
  IAgentEvent,
} from '@shared/types';

interface UseAgentReturn {
  // 状态
  state: AgentState;
  round: number;
  history: IAgentMessage[];
  isRunning: boolean;
  streamingContent: string;
  lastResponse: IAgentResponse | null;
  error: string | null;

  // 操作
  start: (config: Partial<IAgentConfig>) => void;
  sendText: (text: string) => Promise<void>;
  startListening: () => Promise<void>;
  stopListening: () => Promise<string>;
  abort: () => void;
  reset: () => void;
}

export function useAgent(): UseAgentReturn {
  const [state, setState] = useState<AgentState>('IDLE');
  const [round, setRound] = useState(0);
  const [history, setHistory] = useState<IAgentMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [lastResponse, setLastResponse] = useState<IAgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mountRef = useRef(false);

  // 订阅 Agent 事件
  useEffect(() => {
    mountRef.current = true;

    const unsubscribe = interviewAgent.on((event: IAgentEvent) => {
      if (!mountRef.current) return;

      switch (event.type) {
        case 'state_change':
          setState(event.state || 'IDLE');
          if (event.state === 'THINKING') {
            setStreamingContent('');
            setError(null);
          }
          break;

        case 'chunk':
          if (event.chunk) {
            setStreamingContent((prev) => prev + event.chunk);
          }
          break;

        case 'complete':
          setState('IDLE');
          setStreamingContent('');
          if (event.response) {
            setLastResponse(event.response);
            setRound(event.response.round);
          }
          // 同步 history
          setHistory([...interviewAgent.history]);
          break;

        case 'error':
          setError(event.error || '未知错误');
          setState('IDLE');
          setStreamingContent('');
          break;

        case 'speech_result':
          if (event.transcript) {
            setStreamingContent(event.transcript);
          }
          break;
      }
    });

    return () => {
      mountRef.current = false;
      unsubscribe();
    };
  }, []);

  // 包装操作
  const start = useCallback((config: Partial<IAgentConfig>) => {
    setError(null);
    setHistory([]);
    setLastResponse(null);
    setRound(0);
    interviewAgent.start(config);
  }, []);

  const sendText = useCallback(async (text: string) => {
    setError(null);
    await interviewAgent.sendText(text);
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    await interviewAgent.startListening();
  }, []);

  const stopListening = useCallback(async () => {
    return interviewAgent.stopListening();
  }, []);

  const abort = useCallback(() => {
    interviewAgent.abort();
    setState('IDLE');
    setStreamingContent('');
  }, []);

  const reset = useCallback(() => {
    interviewAgent.reset();
    setHistory([]);
    setRound(0);
    setLastResponse(null);
    setError(null);
    setState('IDLE');
    setStreamingContent('');
  }, []);

  return {
    state,
    round,
    history,
    isRunning: interviewAgent.isRunning,
    streamingContent,
    lastResponse,
    error,
    start,
    sendText,
    startListening,
    stopListening,
    abort,
    reset,
  };
}
