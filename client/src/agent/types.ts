/**
 * Agent 模块内部类型定义
 * 与 shared/types 中的公共类型配合使用
 */
import type {
  AgentState,
  AgentMode,
  IAgentConfig,
  IAgentMessage,
  IAgentMessageMeta,
  IAgentResponse,
  IAgentEvent,
  IAgentEventHandler,
  ISTTApiConfig,
  ILocalApiConfig,
  IChatMessage,
} from '@shared/types';

export type {
  AgentState,
  AgentMode,
  IAgentConfig,
  IAgentMessage,
  IAgentMessageMeta,
  IAgentResponse,
  IAgentEvent,
  IAgentEventHandler,
  ISTTApiConfig,
};

/** Agent 对外暴露的接口 */
export interface IInterviewAgent {
  /** 当前状态 */
  readonly state: AgentState;
  /** 当前面试轮次 */
  readonly round: number;
  /** 对话历史 */
  readonly history: IAgentMessage[];
  /** 是否正在运行 */
  readonly isRunning: boolean;

  /** 启动 Agent */
  start(config: IAgentConfig): void;
  /** 发送文字消息 */
  sendText(text: string): Promise<void>;
  /** 开始录音 */
  startListening(): Promise<void>;
  /** 停止录音并转写 */
  stopListening(): Promise<string>;
  /** 取消当前操作 */
  abort(): void;
  /** 重置 Agent */
  reset(): void;
  /** 注册事件监听 */
  on(event: IAgentEventHandler): () => void;
}

/** Agent LLM 调用参数 */
export interface AgentLLMCall {
  systemPrompt: string;
  messages: IChatMessage[];
  onChunk: (chunk: string) => void;
  onComplete: (fullContent: string) => void;
  onError: (error: Error) => void;
  signal: AbortSignal;
}

/** 上下文构建参数 */
export interface ContextBuildParams {
  agentConfig: IAgentConfig;
  history: IAgentMessage[];
  currentMessage: string;
  round: number;
}
