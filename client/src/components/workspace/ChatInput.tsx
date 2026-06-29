import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Send } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ChatInputProps {
  questionId: string;
  disabled?: boolean;
  onSend?: (content: string) => void;
}

export default function ChatInput({ questionId, disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!value.trim() || disabled) return;
    onSend?.(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? 'AI正在生成回答...' : '输入追问内容 (Enter发送, Shift+Enter换行)'}
        rows={1}
        disabled={disabled}
        className={cn(
          'flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl',
          'bg-white dark:bg-gray-800 resize-none',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'placeholder:text-gray-400 dark:placeholder:text-gray-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'max-h-32'
        )}
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        className="rounded-xl"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
