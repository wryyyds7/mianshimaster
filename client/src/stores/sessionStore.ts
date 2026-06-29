import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IQuestion, IAnswer, ISession, IBackgroundFile, IFileInfo } from '@shared/types';
import type { IChatMessage } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

interface SessionState {
  sessionId: string | null;
  sessionTitle: string;
  isActive: boolean;
  backgroundFiles: IFileInfo[];
  contextText: string;
  questions: IQuestion[];
  activeQuestionId: string | null;
  streamingContent: string;
  isStreaming: boolean;

  // 历史会话列表（持久化）
  historySessions: ISession[];

  // 操作
  setSessionTitle: (title: string) => void;
  enterWorkspace: (files: IFileInfo[], contextText: string) => void;
  exitWorkspace: (saveEnabled?: boolean) => void;
  addQuestion: (title: string, content: string) => IQuestion;
  selectQuestion: (id: string) => void;
  addAnswer: (questionId: string, answer: IAnswer) => void;
  startStreaming: (questionId: string) => void;
  appendStreamChunk: (chunk: string) => void;
  endStreaming: (answer: IAnswer) => void;
  cancelStreaming: () => void;
  getActiveQuestion: () => IQuestion | undefined;
  clearFiles: () => void;
  deleteHistorySession: (id: string) => void;
  clearHistory: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      sessionTitle: '',
      isActive: false,
      backgroundFiles: [],
      contextText: '',
      questions: [],
      activeQuestionId: null,
      streamingContent: '',
      isStreaming: false,
      historySessions: [],

      setSessionTitle: (title) => set({ sessionTitle: title }),

      enterWorkspace: (files, contextText) =>
        set({
          sessionId: uuidv4(),
          isActive: true,
          backgroundFiles: files,
          contextText,
          questions: [],
          activeQuestionId: null,
          streamingContent: '',
          isStreaming: false,
        }),

      exitWorkspace: (saveEnabled = true) => {
        const state = get();
        const currentSession: ISession | null = saveEnabled && state.sessionId && state.questions.length > 0
          ? {
              id: state.sessionId,
              userId: 'local-user',
              title: state.sessionTitle || `会话 ${new Date().toLocaleString('zh-CN')}`,
              status: 'ENDED',
              startedAt: state.questions[state.questions.length - 1]?.createdAt || new Date().toISOString(),
              endedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              backgroundFiles: state.backgroundFiles.map((f, i) => ({
                id: uuidv4(),
                sessionId: state.sessionId!,
                fileName: f.name,
                fileType: f.type,
                fileSize: f.size,
                contentText: state.contextText,
                createdAt: new Date().toISOString(),
              })),
              questions: state.questions,
            }
          : null;

        set({
          sessionId: null,
          isActive: false,
          backgroundFiles: [],
          contextText: '',
          questions: [],
          activeQuestionId: null,
          streamingContent: '',
          isStreaming: false,
          historySessions: currentSession
            ? [currentSession, ...state.historySessions]
            : state.historySessions,
        });
      },

      addQuestion: (title, content) => {
        const question: IQuestion = {
          id: uuidv4(),
          sessionId: get().sessionId || '',
          askerId: uuidv4(),
          title,
          content,
          priority: Date.now(),
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          answeredAt: null,
          answers: [],
        };
        set((state) => ({
          questions: [question, ...state.questions],
          activeQuestionId: question.id,
        }));
        return question;
      },

      selectQuestion: (id) => set({ activeQuestionId: id }),

      addAnswer: (questionId, answer) =>
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  status: 'ANSWERED' as const,
                  answeredAt: new Date().toISOString(),
                  answers: [...q.answers, answer],
                }
              : q
          ),
        })),

      startStreaming: (questionId) =>
        set((state) => ({
          isStreaming: true,
          streamingContent: '',
          activeQuestionId: questionId,
          questions: state.questions.map((q) =>
            q.id === questionId ? { ...q, status: 'ANSWERING' as const } : q
          ),
        })),

      appendStreamChunk: (chunk) =>
        set((state) => ({
          streamingContent: state.streamingContent + chunk,
        })),

      endStreaming: (answer) =>
        set((state) => ({
          isStreaming: false,
          streamingContent: '',
          questions: state.questions.map((q) =>
            q.id === answer.questionId
              ? {
                  ...q,
                  status: 'ANSWERED' as const,
                  answeredAt: new Date().toISOString(),
                  answers: [...q.answers, answer],
                }
              : q
          ),
        })),

      cancelStreaming: () =>
        set((state) => ({
          isStreaming: false,
          streamingContent: '',
          questions: state.questions.map((q) =>
            q.id === state.activeQuestionId && q.status === 'ANSWERING'
              ? { ...q, status: 'PENDING' as const }
              : q
          ),
        })),

      getActiveQuestion: () => {
        const state = get();
        return state.questions.find((q) => q.id === state.activeQuestionId);
      },

      clearFiles: () => set({ backgroundFiles: [], contextText: '' }),

      deleteHistorySession: (id) =>
        set((state) => ({
          historySessions: state.historySessions.filter((s) => s.id !== id),
        })),

      clearHistory: () => set({ historySessions: [] }),
    }),
    {
      name: 'mianshimaster-sessions',
      partialize: (state) => ({
        historySessions: state.historySessions,
      }),
    }
  )
);
