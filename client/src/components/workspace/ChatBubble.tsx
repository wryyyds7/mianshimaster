import React from 'react';
import { cn } from '../../utils/cn';
import { User, Bot, Clock } from 'lucide-react';
import { marked } from 'marked';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  tokensUsed?: number | null;
}

export default function ChatBubble({ role, content, timestamp, model, tokensUsed }: ChatBubbleProps) {
  const isUser = role === 'user';

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* 头像 */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
          isUser
            ? 'bg-indigo-100 dark:bg-indigo-900/50'
            : 'bg-green-100 dark:bg-green-900/50'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        ) : (
          <Bot className="w-4 h-4 text-green-600 dark:text-green-400" />
        )}
      </div>

      {/* 内容气泡 */}
      <div className={cn('flex-1 min-w-0', isUser ? 'flex flex-col items-end' : '')}>
        <div
          className={cn(
            'px-4 py-3 rounded-2xl max-w-[85%]',
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm ml-auto'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          ) : (
            <div
              className="markdown-body text-sm"
              dangerouslySetInnerHTML={{ __html: marked.parse(content, { breaks: true }) as string }}
            />
          )}
        </div>

        {/* 元信息 */}
        <div
          className={cn(
            'flex items-center gap-2 mt-1 px-1',
            isUser && 'flex-row-reverse'
          )}
        >
          <span className="text-xs text-gray-400 flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {formatTime(timestamp)}
          </span>
          {!isUser && model && (
            <>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{model}</span>
            </>
          )}
          {!isUser && tokensUsed && (
            <>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">{tokensUsed} tokens</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
