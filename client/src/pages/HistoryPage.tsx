import React, { useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Search, Download, Eye, Trash2, Calendar, MessageSquare, FileText } from 'lucide-react';
import { cn } from '../utils/cn';
import { useSessionStore } from '../stores/sessionStore';
import type { ISession } from '@shared/types';

export default function HistoryPage() {
  const { historySessions, deleteHistorySession, clearHistory } = useSessionStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<ISession | null>(null);

  const filteredSessions = useMemo(
    () =>
      searchQuery
        ? historySessions.filter(
            (s) =>
              s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.questions?.some((q) =>
                q.content.toLowerCase().includes(searchQuery.toLowerCase())
              )
          )
        : historySessions,
    [historySessions, searchQuery]
  );

  const formatDate = (isoStr: string) =>
    new Date(isoStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  // 导出会话为JSON
  const handleExport = (session: ISession) => {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 删除会话
  const handleDelete = (id: string) => {
    if (selectedSession?.id === id) setSelectedSession(null);
    deleteHistorySession(id);
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">历史记录</h1>
          {historySessions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearHistory} className="text-red-500 hover:text-red-700">
              清空全部
            </Button>
          )}
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索会话或问题内容..."
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
          {filteredSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
              <p>{searchQuery ? '没有匹配的会话' : '暂无历史记录'}</p>
              {!searchQuery && <p className="text-sm mt-1">在工作台中退出时会自动保存会话</p>}
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
                    <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                      已结束
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
                  <Button variant="outline" size="sm" onClick={() => handleExport(selectedSession)}>
                    <Download className="w-4 h-4 mr-1" />
                    导出JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(selectedSession.id)}
                  >
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
                      <div>
                        <p className="text-xs text-gray-400 mb-1">{q.title}</p>
                        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{q.content}</p>
                      </div>
                    </div>
                    {q.answers?.map((a) => (
                      <div key={a.id} className="flex items-start gap-3 ml-4 pl-4 border-l-2 border-green-200 dark:border-green-800">
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                          答
                        </span>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{a.content}</p>
                          {a.model && (
                            <p className="text-xs text-gray-400 mt-1">模型: {a.model}</p>
                          )}
                        </div>
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
