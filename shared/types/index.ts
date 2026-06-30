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

// ========== Agent 相关类型 ==========
export type AgentState = 'IDLE' | 'LISTENING' | 'THINKING' | 'RESPONDING';
export type AgentMode = 'voice' | 'text' | 'review';

export interface IAgentConfig {
  mode: AgentMode;
  interviewRole: string;        // 面试官角色描述
  interviewStyle: string;       // 面试风格 (结构化/压力面/行为面)
  targetPosition: string;       // 目标岗位
  candidateResume: string;      // 候选人简历摘要（可作为system context）
  evaluationCriteria: string[]; // 评分维度
  maxRounds: number;            // 最大面试轮次
  language: 'zh-CN' | 'en-US'; // 面试语言
}

export interface ISTTApiConfig {
  provider: 'web-speech' | 'openai-whisper' | 'tencent-asr';
  apiKey: string;
  baseUrl: string;
  language: string;  // 识别语言代码
}

export interface IAgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: IAgentMessageMeta;
}

export interface IAgentMessageMeta {
  /** LLM 内部评分（0-100），仅 assistant 消息 */
  score?: number;
  /** 涉及的知识点标签 */
  knowledgeTags?: string[];
  /** 下一轮策略 */
  nextStrategy?: 'follow_up' | 'new_topic' | 'summary' | 'end';
  /** 该轮对话耗时(ms) */
  duration?: number;
}

export interface IAgentResponse {
  /** 给用户看的显示内容 */
  displayContent: string;
  /** 结构化元数据 */
  metadata?: IAgentMessageMeta;
  /** 当前对话轮次 */
  round: number;
  /** 是否结束 */
  isComplete: boolean;
}

export interface IAgentEvent {
  type: 'state_change' | 'chunk' | 'complete' | 'error' | 'speech_result';
  state?: AgentState;
  chunk?: string;
  response?: IAgentResponse;
  error?: string;
  transcript?: string;
}

export type IAgentEventHandler = (event: IAgentEvent) => void;

// ========== 反馈类型 ==========
export type FeedbackType = 'BUG' | 'FEATURE' | 'QUESTION' | 'OTHER';

export interface IFeedback {
  userId?: string;
  type: FeedbackType;
  title: string;
  content: string;
  contact?: string;
}
