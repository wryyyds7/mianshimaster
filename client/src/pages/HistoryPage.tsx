import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Download, Eye, Trash2, Calendar, MessageSquare, FileText } from 'lucide-react';
import { cn } from '../utils/cn';
import { sessionService } from '../services/sessionService';
import type { ISession } from '@shared/types';

export default function HistoryPage() {
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ISession | null>(null);

  useEffect(() => {
    // 模拟加载历史记录
    setLoading(true);
    setTimeout(() => {
      setSessions([
        {
          id: '1',
          userId: 'user1',
          title: '前端技术面试',
          status: 'ENDED',
          startedAt: '2024-01-15T09:00:00Z',
          endedAt: '2024-01-15T10:30:00Z',
          createdAt: '2024-01-15T09:00:00Z',
          backgroundFiles: [{ id: 'f1', sessionId: '1', fileName: '面试大纲.pdf', fileType: 'pdf', fileSize: 2048000, contentText: '', createdAt: '' }],
          questions: [
            { id: 'q1', sessionId: '1', askerId: 'a1', title: 'React Hooks', content: 'useEffect和useLayoutEffect的区别？', priority: 1, status: 'ANSWERED', createdAt: '2024-01-15T09:05:00Z', answeredAt: '2024-01-15T09:05:30Z', answers: [{ id: 'ans1', questionId: 'q1', content: 'useEffect在浏览器绘制后异步执行...', model: 'gpt-4o', tokensUsed: 200, duration: 1500, isStreamed: true, createdAt: '2024-01-15T09:05:30Z' }] },
          ],
        },
      ] as ISession[]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (isoStr: string) =>
    new Date(isoStr).toLocaleDateString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">历史记录</h1>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索会话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 会话列表 */}
        <div className="w-[420px] border-r border-gray-200 dark:border-gray-700 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-12 text-gray-400">加载中...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
              <p>暂无历史记录</p>
            </div>
          ) : (
            <div className="py-1">
              {filteredSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={cn(
                    'w-full text-left px-4 py-3 border-l-2 transition-colors',
                    selectedSession?.id === session.id
                      ? 'border-l-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {session.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(session.startedAt)}
                      </div>
                    </div>
                    <span className={cn(
                      'text-xs px-1.5 py-0.5 rounded-full flex-shrink-0',
                      session.status === 'ENDED'
                        ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        : 'bg-green-100 text-green-600'
                    )}>
                      {session.status === 'ENDED' ? '已结束' : '进行中'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                    <MessageSquare className="w-3 h-3" />
                    {session.questions?.length || 0} 个问题
                    {session.backgroundFiles?.length > 0 && (
                      <>
                        <span className="mx-1">·</span>
                        <FileText className="w-3 h-3" />
                        {session.backgroundFiles.length} 个文件
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 会话详情 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {selectedSession ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {selectedSession.title}
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    导出
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {selectedSession.questions?.map((q) => (
                  <div key={q.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                        问
                      </span>
                      <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{q.content}</p>
                    </div>
                    {q.answers?.map((a) => (
                      <div key={a.id} className="flex items-start gap-3 ml-4 pl-4 border-l-2 border-green-200 dark:border-green-800">
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                          答
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{a.content}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <Eye className="w-12 h-12 mb-3 opacity-30" />
              <p>选择一个会话查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
