/**
 * Agent 对话面板 —— Agent 模拟面试模式的聊天界面
 * 独立组件，与现有 ChatDetail 解耦
 */
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';
import {
  Send,
  Mic,
  Square,
  Bot,
  User,
  Loader2,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import type { AgentState, IAgentMessage, IAgentResponse } from '@shared/types';

interface AgentChatPanelProps {
  state: AgentState;
  round: number;
  maxRounds: number;
  history: IAgentMessage[];
  streamingContent: string;
  lastResponse: IAgentResponse | null;
  error: string | null;
  isSpeechSupported: boolean;
  onSendText: (text: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onAbort: () => void;
  onReset: () => void;
}

export default function AgentChatPanel({
  state,
  round,
  maxRounds,
  history,
  streamingContent,
  lastResponse,
  error,
  isSpeechSupported,
  onSendText,
  onStartListening,
  onStopListening,
  onAbort,
  onReset,
}: AgentChatPanelProps) {
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, streamingContent]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || state !== 'IDLE') return;
    setInput('');
    onSendText(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (msg: IAgentMessage, index: number) => {
    const isUser = msg.role === 'user';
    const isLast = index === history.length - 1;

    return (
      <div
        key={index}
        className={cn(
          'flex gap-3 px-4 py-3',
          isUser ? 'bg-gray-50 dark:bg-gray-900/50' : 'bg-white dark:bg-gray-800',
        )}
      >
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
          isUser
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600'
            : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600',
        )}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400 mb-1">
            {isUser ? '你' : '面试官'} {isLast && msg.metadata?.score != null && (
              <span className="ml-2 text-amber-500">评分: {msg.metadata.score}/100</span>
            )}
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {msg.content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 聊天头部信息 */}
      <div className="h-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            模拟面试 · 第 {round}/{maxRounds} 轮
          </span>
          {state === 'THINKING' && (
            <span className="flex items-center gap-1 text-xs text-indigo-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              思考中...
            </span>
          )}
          {state === 'LISTENING' && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              录音中...
            </span>
          )}
        </div>
        <button
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          重新开始
        </button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {history.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-3">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-gray-400">Agent 面试即将开始...</p>
            </div>
          </div>
        )}

        {history.map((msg, i) => renderMessage(msg, i))}

        {/* 流式输出中 */}
        {streamingContent && (
          <div className="flex gap-3 px-4 py-3 bg-white dark:bg-gray-800">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400 mb-1">面试官</div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {streamingContent}
                <span className="inline-block w-2 h-4 bg-indigo-500 ml-1 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* 面试完成 */}
        {lastResponse?.isComplete && (
          <div className="px-4 py-6 text-center bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-200 dark:border-emerald-800">
            <p className="text-emerald-700 dark:text-emerald-300 font-medium">
              🎉 面试结束
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
              你可以点击"重新开始"进行新一轮面试
            </p>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 flex items-center gap-2 shrink-0">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
        </div>
      )}

      {/* 底部输入栏 */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shrink-0">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          {isSpeechSupported && (
            <button
              onClick={state === 'LISTENING' ? onStopListening : onStartListening}
              disabled={state === 'THINKING'}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                state === 'LISTENING'
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200',
              )}
            >
              {state === 'LISTENING' ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={state === 'THINKING' ? '面试官正在思考...' : '输入你的回答... (Enter 发送, Shift+Enter 换行)'}
            disabled={state !== 'IDLE' || lastResponse?.isComplete}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />

          {state === 'THINKING' ? (
            <button
              onClick={onAbort}
              className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 flex items-center justify-center shrink-0"
              title="停止生成"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim() || state !== 'IDLE' || lastResponse?.isComplete}
              className="w-10 h-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center shrink-0 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
