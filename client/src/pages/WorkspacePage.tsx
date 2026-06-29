import React, { useState, useCallback } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useConfigStore } from '../stores/configStore';
import { Button } from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import FileUploader from '../components/workspace/FileUploader';
import QuestionList from '../components/workspace/QuestionList';
import ChatDetail from '../components/workspace/ChatDetail';
import { aiService } from '../services/aiService';
import { LogOut, Upload, FileText, AlertCircle } from 'lucide-react';
import type { IFileInfo } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

export default function WorkspacePage() {
  const {
    isActive, sessionTitle, backgroundFiles, contextText, questions,
    activeQuestionId, isStreaming,
    enterWorkspace, exitWorkspace, addQuestion, addAnswer, selectQuestion,
    startStreaming, appendStreamChunk, endStreaming, cancelStreaming,
    setSessionTitle, clearFiles,
  } = useSessionStore();

  const { localApi, apiMode, serverApi } = useConfigStore();
  const [showEntrance, setShowEntrance] = useState(!isActive);

  // 进入工作台
  const handleEnterWorkspace = (files: IFileInfo[], text: string) => {
    enterWorkspace(files, text);
    setShowEntrance(false);
  };

  // 退出工作台
  const handleExit = () => {
    // 如果正在流式输出，取消
    if (isStreaming) {
      cancelStreaming();
    }
    // TODO: 保存会话到本地/服务器
    exitWorkspace();
    setShowEntrance(true);
  };

  // 新增问题（模拟提问者提交）
  const handleNewQuestion = useCallback((title: string, content: string) => {
    const question = addQuestion(title, content);

    // 触发AI回答
    const config = apiMode === 'local'
      ? localApi
      : { provider: 'openai' as const, apiKey: serverApi.token || '', baseUrl: serverApi.baseUrl, model: 'gpt-4o', temperature: 0.7, maxTokens: 4096 };

    startStreaming(question.id);

    aiService.streamChat(
      config,
      contextText,
      [{ role: 'user', content }],
      (chunk) => appendStreamChunk(chunk),
      (fullContent) => {
        endStreaming({
          id: uuidv4(),
          questionId: question.id,
          content: fullContent,
          model: config.model,
          tokensUsed: null,
          duration: null,
          isStreamed: true,
          createdAt: new Date().toISOString(),
        });
      },
      (error) => {
        cancelStreaming();
        console.error('AI回答失败:', error);
      }
    );
  }, [apiMode, localApi, serverApi, contextText, addQuestion, startStreaming, appendStreamChunk, endStreaming, cancelStreaming]);

  // 入口界面（未进入工作台时）
  if (!isActive) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
            <Upload className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            AI 问答工作台
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            上传背景文件作为AI的上下文参考，然后开始回答提问者的问题。
            你的身份固定为回答者。
          </p>
          <Button size="lg" onClick={() => setShowEntrance(true)}>
            <Upload className="w-5 h-5 mr-2" />
            上传背景文件并开始
          </Button>
        </div>

        {/* 文件上传弹窗 */}
        <Modal
          open={showEntrance}
          onClose={() => setShowEntrance(false)}
          title="上传背景文件"
        >
          <div className="p-6">
            <FileUploader
              onComplete={handleEnterWorkspace}
              onCancel={() => setShowEntrance(false)}
            />
          </div>
        </Modal>
      </div>
    );
  }

  // 工作台界面
  return (
    <div className="h-full flex flex-col">
      {/* 顶部状态栏 */}
      <div className="h-12 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {sessionTitle || '回答工作台'}
          </h2>
          {backgroundFiles.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <FileText className="w-3.5 h-3.5" />
              {backgroundFiles.length} 个背景文件
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <span className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              AI生成中...
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleExit}>
            <LogOut className="w-4 h-4 mr-1" />
            退出
          </Button>
        </div>
      </div>

      {/* 主体：左侧问题列表 + 右侧对话详情 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧 - 问题列表 (30%) */}
        <div className="w-[360px] border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
          <QuestionList
            questions={questions}
            activeId={activeQuestionId}
            onSelect={selectQuestion}
            onNewQuestion={handleNewQuestion}
            isStreaming={isStreaming}
          />
        </div>

        {/* 右侧 - 对话详情 (70%) */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatDetail
            question={questions.find(q => q.id === activeQuestionId) || null}
            isStreaming={isStreaming}
            streamingContent={useSessionStore((s) => s.streamingContent)}
          />
        </div>
      </div>
    </div>
  );
}
