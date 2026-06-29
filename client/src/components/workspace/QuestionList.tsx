import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Plus, MessageSquare, Clock } from 'lucide-react';
import type { IQuestion } from '@shared/types';

interface QuestionListProps {
  questions: IQuestion[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewQuestion: (title: string, content: string) => void;
  isStreaming: boolean;
}

export default function QuestionList({
  questions,
  activeId,
  onSelect,
  onNewQuestion,
  isStreaming,
}: QuestionListProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleSubmit = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    onNewQuestion(newTitle.trim(), newContent.trim());
    setNewTitle('');
    setNewContent('');
    setShowNewForm(false);
  };

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const statusConfig = {
    PENDING: { label: '待回答', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    ANSWERING: { label: '回答中', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    ANSWERED: { label: '已回答', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    CANCELLED: { label: '已取消', color: 'bg-gray-100 text-gray-500' },
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          问题列表 ({questions.length})
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNewForm(!showNewForm)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* 新问题表单 */}
      {showNewForm && (
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <input
            type="text"
            placeholder="问题标题"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <textarea
            placeholder="问题内容..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex gap-2 mt-2">
            <Button size="sm" onClick={handleSubmit} disabled={isStreaming}>
              提交
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>
              取消
            </Button>
          </div>
        </div>
      )}

      {/* 问题列表 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 px-4 text-center">
            <MessageSquare className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm">暂无问题</p>
            <p className="text-xs mt-1">点击 + 添加新问题</p>
          </div>
        ) : (
          <div className="py-1">
            {questions.map((q) => {
              const st = statusConfig[q.status];
              return (
                <button
                  key={q.id}
                  onClick={() => onSelect(q.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 transition-colors border-l-2',
                    activeId === q.id
                      ? 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                      {q.title}
                    </span>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full flex-shrink-0', st.color)}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">{formatTime(q.createdAt)}</span>
                    {q.answers.length > 0 && (
                      <span className="text-xs text-gray-400">
                        · {q.answers.length} 个回答
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
