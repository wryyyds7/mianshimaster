import React, { useState, useCallback } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useConfigStore } from '../stores/configStore';
import { Button } from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import FileUploader from '../components/workspace/FileUploader';
import QuestionList from '../components/workspace/QuestionList';
import ChatDetail from '../components/workspace/ChatDetail';
import AgentChatPanel from '../components/workspace/AgentChatPanel';
import { aiService } from '../services/aiService';
import { useAgent } from '../hooks/useAgent';
import { isSpeechSupported } from '../agent/SpeechInput';
import { LogOut, Upload, FileText, AlertTriangle, XCircle, Bot, MessageSquare } from 'lucide-react';
import type { IFileInfo, IAgentConfig } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

type WorkspaceMode = 'qa' | 'agent';

export default function WorkspacePage() {
  const {
    isActive, sessionTitle, backgroundFiles, contextText, questions,
    activeQuestionId, isStreaming,
    enterWorkspace, exitWorkspace, addQuestion, addAnswer, selectQuestion,
    startStreaming, appendStreamChunk, endStreaming, cancelStreaming,
    setSessionTitle, clearFiles,
  } = useSessionStore();

  const { localApi, apiMode, serverApi } = useConfigStore();
  const streamingContent = useSessionStore((s) => s.streamingContent);
  const [showEntrance, setShowEntrance] = useState(!isActive);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('qa');

  // Agent hook
  const agent = useAgent();
  const speechSupported = isSpeechSupported();

  // 进入工作台
  const handleEnterWorkspace = (files: IFileInfo[], text: string) => {
    enterWorkspace(files, text);
    setShowEntrance(false);
  };

  // 退出工作台
  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    if (isStreaming) {
      cancelStreaming();
    }
    agent.reset(); // 同时关闭 Agent
    exitWorkspace();
    setShowEntrance(true);
    setShowExitConfirm(false);
    setAiError(null);
  };

  // Agent 模式启动
  const handleStartAgent = (files: IFileInfo[], text: string) => {
    enterWorkspace(files, text);
    setWorkspaceMode('agent');
    setShowEntrance(false);

    // 用上传的文件内容作为简历上下文
    const agentConfig: Partial<IAgentConfig> = {
      mode: speechSupported ? 'voice' : 'text',
      candidateResume: text || '未提供简历',
      language: 'zh-CN',
    };
    agent.start(agentConfig);
  };

  // 新增问题（模拟提问者提交）
  const handleNewQuestion = useCallback((title: string, content: string) => {
    const question = addQuestion(title, content);

    // 触发AI回答 — 根据模式选择不同路径
    setAiError(null); // 清除之前的错误
    startStreaming(question.id);

    if (apiMode === 'server' && serverApi.token) {
      // 服务器模式：通过服务器代理调用AI
      aiService.streamChatServer(
        serverApi.baseUrl,
        serverApi.token,
        contextText,
        [{ role: 'user', content }],
        'gpt-4o',
        0.7,
        (chunk) => appendStreamChunk(chunk),
        (fullContent) => {
          endStreaming({
            id: uuidv4(),
            questionId: question.id,
            content: fullContent,
            model: 'gpt-4o',
            tokensUsed: null,
            duration: null,
            isStreamed: true,
            createdAt: new Date().toISOString(),
          });
        },
        (error) => {
          cancelStreaming();
          const msg = error instanceof Error ? error.message : String(error);
          setAiError(`AI 回答失败：${msg}`);
        },
      ).catch((err) => {
        cancelStreaming();
        const msg = err instanceof Error ? err.message : String(err);
        setAiError(`AI 连接异常：${msg}`);
      });
    } else {
      // 本地模式：直连AI API
      aiService.streamChat(
        localApi,
        contextText,
        [{ role: 'user', content }],
        (chunk) => appendStreamChunk(chunk),
        (fullContent) => {
          endStreaming({
            id: uuidv4(),
            questionId: question.id,
            content: fullContent,
            model: localApi.model,
            tokensUsed: null,
            duration: null,
            isStreamed: true,
            createdAt: new Date().toISOString(),
          });
        },
        (error) => {
          cancelStreaming();
          const msg = error instanceof Error ? error.message : String(error);
          setAiError(`AI 回答失败：${msg}`);
        },
      ).catch((err) => {
        cancelStreaming();
        const msg = err instanceof Error ? err.message : String(err);
        setAiError(`AI 连接异常：${msg}`);
      });
    }
  }, [apiMode, localApi, serverApi, contextText, isStreaming, addQuestion, startStreaming, appendStreamChunk, endStreaming, cancelStreaming]);

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
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={() => {
              setWorkspaceMode('qa');
              setShowEntrance(true);
            }}>
              <MessageSquare className="w-5 h-5 mr-2" />
              问答模式 - 上传文件并开始
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              setWorkspaceMode('agent');
              setShowEntrance(true);
            }}>
              <Bot className="w-5 h-5 mr-2" />
              Agent 模拟面试
            </Button>
          </div>
        </div>

        {/* 退出确认弹窗 */}
        <Modal
          open={showExitConfirm}
          onClose={() => setShowExitConfirm(false)}
          title="退出工作台"
        >
          <div className="p-6">
            <div className="flex items-start gap-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                  确定要退出工作台吗？
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {questions.length > 0
                    ? `当前有 ${questions.length} 个问答记录，退出后将自动保存到历史记录。`
                    : '当前没有问答记录，退出后不会保存。'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowExitConfirm(false)}>
                取消
              </Button>
              <Button onClick={confirmExit} className="bg-red-500 hover:bg-red-600">
                确认退出
              </Button>
            </div>
          </div>
        </Modal>

        {/* 文件上传弹窗 */}
        <Modal
          open={showEntrance}
          onClose={() => setShowEntrance(false)}
          title={workspaceMode === 'agent' ? '上传简历 - Agent 模拟面试' : '上传背景文件'}
        >
          <div className="p-6">
            {workspaceMode === 'agent' && (
              <p className="text-sm text-gray-500 mb-4">
                上传你的简历文件，Agent 将作为面试官根据简历内容进行针对性提问。
              </p>
            )}
            <FileUploader
              onComplete={workspaceMode === 'agent' ? handleStartAgent : handleEnterWorkspace}
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
            {sessionTitle || (workspaceMode === 'agent' ? 'Agent 模拟面试' : '回答工作台')}
          </h2>
          {/* 模式切换 */}
          <div className="flex rounded-md bg-gray-100 dark:bg-gray-700 p-0.5">
            <button
              onClick={() => setWorkspaceMode('qa')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                workspaceMode === 'qa'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-3 h-3 inline mr-1" />
              问答
            </button>
            <button
              onClick={() => setWorkspaceMode('agent')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                workspaceMode === 'agent'
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Bot className="w-3 h-3 inline mr-1" />
              Agent
            </button>
          </div>
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

      {/* AI 错误提示条（仅问答模式） */}
      {workspaceMode === 'qa' && aiError && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-start gap-3 shrink-0">
          <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300 flex-1">{aiError}</p>
          <button
            onClick={() => setAiError(null)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* 主体 */}
      <div className="flex-1 flex overflow-hidden">
        {workspaceMode === 'agent' ? (
          /* Agent 模拟面试模式 */
          <AgentChatPanel
            state={agent.state}
            round={agent.round}
            maxRounds={10}
            history={agent.history}
            streamingContent={agent.streamingContent}
            lastResponse={agent.lastResponse}
            error={agent.error}
            isSpeechSupported={speechSupported}
            onSendText={agent.sendText}
            onStartListening={agent.startListening}
            onStopListening={agent.stopListening}
            onAbort={agent.abort}
            onReset={() => {
              const config: Partial<IAgentConfig> = {
                mode: speechSupported ? 'voice' : 'text',
                candidateResume: contextText || '未提供简历',
                language: 'zh-CN',
              };
              agent.reset();
              agent.start(config);
            }}
          />
        ) : (
          /* 问答模式 */
          <>
            <div className="w-[360px] border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
              <QuestionList
                questions={questions}
                activeId={activeQuestionId}
                onSelect={selectQuestion}
                onNewQuestion={handleNewQuestion}
                isStreaming={isStreaming}
              />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
              <ChatDetail
                question={questions.find(q => q.id === activeQuestionId) || null}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
              />
            </div>
          </>
        )}
      </div>

      {/* 退出确认弹窗（工作台内） */}
      <Modal
        open={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="退出工作台"
      >
        <div className="p-6">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                确定要退出工作台吗？
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {questions.length > 0
                  ? `当前有 ${questions.length} 个问答记录，退出后将自动保存到历史记录。`
                  : '当前没有问答记录，退出后不会保存。'}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowExitConfirm(false)}>
              取消
            </Button>
            <Button onClick={confirmExit} className="bg-red-500 hover:bg-red-600">
              确认退出
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
