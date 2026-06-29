import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import ChatBubble from './ChatBubble';
import ChatInput from './ChatInput';
import { Button } from '../ui/Button';
import { MessageSquare, User, Bot } from 'lucide-react';
import { marked } from 'marked';
import type { IQuestion } from '@shared/types';

interface ChatDetailProps {
  question: IQuestion | null;
  isStreaming: boolean;
  streamingContent: string;
}

export default function ChatDetail({ question, isStreaming, streamingContent }: ChatDetailProps) {
  const [renderedContent, setRenderedContent] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [question?.answers.length, streamingContent, isStreaming]);

  // 渲染Markdown
  useEffect(() => {
    if (streamingContent) {
      try {
        const html = marked.parse(streamingContent, { breaks: true }) as string;
        setRenderedContent(html);
      } catch {
        setRenderedContent(streamingContent);
      }
    } else {
      setRenderedContent('');
    }
  }, [streamingContent]);

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">选择一个问题</p>
        <p className="text-sm mt-1">从左侧列表选择问题查看对话详情</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 对话区域 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 space-y-4">
        {/* 问题 */}
        <ChatBubble role="user" content={question.content} timestamp={question.createdAt} />

        {/* 回答历史 */}
        {question.answers.map((answer) => (
          <ChatBubble
            key={answer.id}
            role="assistant"
            content={answer.content}
            timestamp={answer.createdAt}
            model={answer.model}
            tokensUsed={answer.tokensUsed}
          />
        ))}

        {/* 流式输出中的回答 */}
        {isStreaming && renderedContent && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                <div
                  className="markdown-body text-sm text-gray-900 dark:text-gray-100"
                  dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
                <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-1 align-middle" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <ChatInput questionId={question.id} disabled={isStreaming || question.status === 'ANSWERED'} />
      </div>
    </div>
  );
}
