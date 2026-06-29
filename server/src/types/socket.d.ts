import { ISession, IQuestion, IAnswer } from '../../../shared/types';

/** 工作台命名空间事件定义 */
export interface WorkspaceClientEvents {
  'workspace:join': (payload: { sessionId: string }) => void;
  'workspace:leave': (payload: { sessionId: string }) => void;
  'workspace:new-question': (payload: {
    sessionId: string;
    questionId: string;
    title: string;
    content: string;
  }) => void;
}

export interface WorkspaceServerEvents {
  'workspace:question-added': (payload: { question: IQuestion }) => void;
  'workspace:answer-stream': (payload: {
    questionId: string;
    chunk: string;
  }) => void;
  'workspace:answer-complete': (payload: {
    questionId: string;
    answer: IAnswer;
  }) => void;
  'workspace:error': (payload: {
    message: string;
    code: number;
  }) => void;
}

/** 通知命名空间事件定义 */
export interface NotificationServerEvents {
  notification: (payload: {
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
  }) => void;
}
