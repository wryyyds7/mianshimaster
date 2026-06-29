// ========== 会话相关类型 ==========
export interface IBackgroundFile {
  id: string;
  sessionId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  contentText: string;
  createdAt: string;
}

export type QuestionStatus = 'PENDING' | 'ANSWERING' | 'ANSWERED' | 'CANCELLED';

export interface IQuestion {
  id: string;
  sessionId: string;
  askerId: string;
  title: string;
  content: string;
  priority: number;
  status: QuestionStatus;
  createdAt: string;
  answeredAt: string | null;
  answers: IAnswer[];
}

export interface IAnswer {
  id: string;
  questionId: string;
  content: string;
  model: string;
  tokensUsed: number | null;
  duration: number | null;
  isStreamed: boolean;
  createdAt: string;
}

export type SessionStatus = 'ACTIVE' | 'ENDED';

export interface ISession {
  id: string;
  userId: string;
  title: string;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  backgroundFiles: IBackgroundFile[];
  questions: IQuestion[];
}

// ========== 知识库类型 ==========
export interface IKnowledgeItem {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  sourceFile: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========== 配置类型 ==========
export type ApiMode = 'local' | 'server';

export interface ILocalApiConfig {
  provider: 'openai' | 'claude' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface IServerApiConfig {
  baseUrl: string;
  isLoggedIn: boolean;
  token: string | null;
}

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'zh-CN' | 'en-US';

// ========== 认证类型 ==========
export interface IUser {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface ILoginRequest {
  username: string;
  password: string;
}

export interface ILoginResponse {
  token: string;
  refreshToken: string;
  user: IUser;
}

// ========== API响应类型 ==========
export interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message?: string;
}

export interface ApiError {
  code: number;
  message: string;
  details?: unknown;
}

// ========== AI聊天类型 ==========
export interface IChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface IChatRequest {
  sessionId: string;
  questionId: string;
  model?: string;
  temperature?: number;
  knowledgeIds?: string[];
  messages: IChatMessage[];
}

export interface IChatStreamChunk {
  type: 'start' | 'chunk' | 'done' | 'error';
  content?: string;
  questionId?: string;
  tokensUsed?: number;
  duration?: number;
  error?: string;
}

// ========== 文件类型 ==========
export interface IFileInfo {
  name: string;
  size: number;
  type: string;
  text?: string;
}

// ========== WebSocket事件类型 ==========
export interface WSQuestionAdded {
  sessionId: string;
  question: IQuestion;
}

export interface WSAnswerStream {
  questionId: string;
  chunk: string;
}

export interface WSAnswerComplete {
  questionId: string;
  answer: IAnswer;
}

// ========== 反馈类型 ==========
export type FeedbackType = 'BUG' | 'FEATURE' | 'QUESTION' | 'OTHER';

export interface IFeedback {
  userId?: string;
  type: FeedbackType;
  title: string;
  content: string;
  contact?: string;
}
