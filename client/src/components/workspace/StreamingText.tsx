import React, { useEffect, useRef } from 'react';

interface StreamingTextProps {
  content: string;
  isStreaming: boolean;
  speed?: number; // ms per character
  className?: string;
}

/**
 * 流式文本渲染组件（打字机效果）
 */
export const StreamingText: React.FC<StreamingTextProps> = ({
  content,
  isStreaming,
  speed = 30,
  className = '',
}) => {
  const [displayedText, setDisplayedText] = React.useState('');
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // 非流式模式直接显示全部
    if (!isStreaming) {
      setDisplayedText(content);
      indexRef.current = content.length;
      return;
    }

    // 清除之前的定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // 如果内容比上次短（可能是重置），从上次位置继续
    if (content.length < indexRef.current) {
      indexRef.current = 0;
      setDisplayedText('');
    }

    timerRef.current = setInterval(() => {
      if (indexRef.current < content.length) {
        const chunk = content.slice(indexRef.current, indexRef.current + 1);
        indexRef.current += 1;
        setDisplayedText((prev) => prev + chunk);
      } else {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }, speed);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [content, isStreaming, speed]);

  // 流式结束后清理
  useEffect(() => {
    if (!isStreaming && content) {
      indexRef.current = content.length;
      setDisplayedText(content);
    }
  }, [isStreaming, content]);

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {displayedText}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-blue-500 ml-0.5 animate-pulse align-middle" />
      )}
    </div>
  );
};
