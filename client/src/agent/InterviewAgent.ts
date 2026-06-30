/**
 * 面试 Agent —— 核心编排引擎
 * 
 * 职责：
 * 1. 管理状态机 (IDLE → LISTENING → THINKING → RESPONDING)
 * 2. 协调语音输入、上下文构建、LLM 调用、响应解析
 * 3. 维护对话历史和事件通知
 * 
 * 设计原则：
 * - 不直接依赖 React/Zustand，保持纯逻辑层
 * - 通过事件回调与 UI 层通信
 * - 内置 aiService 调用，上层只需传配置
 */
import { aiService } from '../services/aiService';
import { useConfigStore } from '../stores/configStore';
import { StateMachine } from './StateMachine';
import { contextManager } from './ContextManager';
import { isSpeechSupported, createSTT, type STTProvider } from './SpeechInput';
import type {
  AgentState,
  AgentMode,
  IAgentConfig,
  IAgentMessage,
  IAgentResponse,
  IAgentEvent,
  IAgentEventHandler,
  ISTTApiConfig,
  ILocalApiConfig,
} from '@shared/types';
import type { IInterviewAgent } from './types';

/** 默认 Agent 配置 */
const DEFAULT_CONFIG: IAgentConfig = {
  mode: 'text',
  interviewRole: '技术面试官，负责考察候选人的编程能力、系统设计和问题解决能力',
  interviewStyle: '结构化面试',
  targetPosition: '软件工程师',
  candidateResume: '',
  evaluationCriteria: ['技术深度', '沟通表达', '问题解决', '代码质量'],
  maxRounds: 10,
  language: 'zh-CN',
};

export class InterviewAgent implements IInterviewAgent {
  private _state: AgentState = 'IDLE';
  private _sm = new StateMachine();
  private _config: IAgentConfig = { ...DEFAULT_CONFIG };
  private _history: IAgentMessage[] = [];
  private _round = 0;
  private _handlers: Set<IAgentEventHandler> = new Set();
  private _abortController: AbortController | null = null;

  // ========== 公开属性 ==========

  get state(): AgentState {
    return this._state;
  }

  get round(): number {
    return this._round;
  }

  get history(): IAgentMessage[] {
    return this._history;
  }

  get isRunning(): boolean {
    return this._sm.isBusy;
  }

  // ========== 生命周期 ==========

  /** 启动 Agent，发出第一个面试问题 */
  start(config: Partial<IAgentConfig> = {}): void {
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._history = [];
    this._round = 0;

    this.transitionTo('THINKING');

    // 生成开场问题
    this.generateOpeningQuestion()
      .then((question) => {
        const msg: IAgentMessage = {
          role: 'assistant',
          content: question,
          timestamp: new Date().toISOString(),
        };
        this._history.push(msg);
        this._round = 1;

        this.emit({
          type: 'complete',
          state: this._state,
          response: {
            displayContent: question,
            round: 1,
            isComplete: false,
          },
        });

        this.transitionTo('IDLE');
      })
      .catch((err) => {
        this.emit({ type: 'error', error: `Agent 启动失败: ${err.message}` });
        this.transitionTo('IDLE');
      });
  }

  /** 发送文字消息 */
  async sendText(text: string): Promise<void> {
    if (!this._sm.canAcceptInput) {
      this.emit({ type: 'error', error: 'Agent 正忙，请等待当前操作完成' });
      return;
    }

    this.transitionTo('THINKING');

    const userMsg: IAgentMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    this._history.push(userMsg);

    await this.callLLM(text);
  }

  /** 开始语音监听 */
  async startListening(): Promise<void> {
    if (!isSpeechSupported()) {
      this.emit({ type: 'error', error: '当前环境不支持语音识别' });
      return;
    }

    if (!this._sm.canAcceptInput) {
      this.emit({ type: 'error', error: 'Agent 正忙' });
      return;
    }

    this.transitionTo('LISTENING');

    try {
      const config = useConfigStore.getState();
      const stt = createSTT('web-speech', {
        provider: 'web-speech',
        apiKey: '',
        baseUrl: '',
        language: 'zh-CN',
      });
      await stt.start();
    } catch (err: any) {
      this.emit({ type: 'error', error: `启动录音失败: ${err.message}` });
      this.transitionTo('IDLE');
    }
  }

  /** 停止录音并返回转写文本 */
  async stopListening(): Promise<string> {
    return new Promise((resolve, reject) => {
      // 实际使用时由 SpeechInput 的回调处理
      // 这里简化为直接返回
      const stt = createSTT('web-speech', {
        provider: 'web-speech',
        apiKey: '',
        baseUrl: '',
        language: 'zh-CN',
      });

      stt.stop()
        .then((text) => {
          this.emit({ type: 'speech_result', transcript: text });
          
          // 自动将语音转为文字后送入处理
          this.sendText(text).catch(reject);
          resolve(text);
        })
        .catch(reject);
    });
  }

  /** 取消当前操作 */
  abort(): void {
    this._abortController?.abort();
    this._sm.force('IDLE');
    this._state = 'IDLE';
    this.emit({ type: 'state_change', state: 'IDLE' });
  }

  /** 重置 Agent */
  reset(): void {
    this.abort();
    this._history = [];
    this._round = 0;
    this._config = { ...DEFAULT_CONFIG };
    this._sm.force('IDLE');
    this._state = 'IDLE';
  }

  /** 注册事件监听，返回取消订阅函数 */
  on(handler: IAgentEventHandler): () => void {
    this._handlers.add(handler);
    return () => { this._handlers.delete(handler); };
  }

  // ========== 内部方法 ==========

  /** 状态转换 + 事件通知 */
  private transitionTo(state: AgentState): void {
    if (this._sm.transition(state)) {
      this._state = state;
      this.emit({ type: 'state_change', state });
    }
  }

  /** 发送事件 */
  private emit(event: IAgentEvent): void {
    this._handlers.forEach((h) => {
      try { h(event); } catch { /* 容错 */ }
    });
  }

  /** 生成开场问题 */
  private async generateOpeningQuestion(): Promise<string> {
    const systemPrompt = contextManager.buildSystemPrompt(this._config, 0);
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请开始面试，提出第一个问题。' },
    ];

    return this.executeLLMCall(messages);
  }

  /** 调用 LLM */
  private async callLLM(userText: string): Promise<void> {
    const ctxMessages = contextManager.build({
      agentConfig: this._config,
      history: this._history,
      currentMessage: userText,
      round: this._round + 1,
    });

    try {
      this._abortController = new AbortController();
      const raw = await this.executeLLMCallWithStream(ctxMessages);

      const { displayContent, metadata } = contextManager.parseResponse(raw);
      const isComplete = this._round >= this._config.maxRounds ||
                        metadata?.nextStrategy === 'end';

      const assistantMsg: IAgentMessage = {
        role: 'assistant',
        content: displayContent,
        timestamp: new Date().toISOString(),
        metadata,
      };
      this._history.push(assistantMsg);
      this._round++;

      this.emit({
        type: 'complete',
        state: this._state,
        response: {
          displayContent,
          metadata,
          round: this._round,
          isComplete,
        },
      });

      this.transitionTo('RESPONDING');
      // 短暂停留 RESPONDING 后切到 IDLE
      setTimeout(() => this.transitionTo('IDLE'), 100);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      this.emit({ type: 'error', error: `LLM 调用失败: ${err.message}` });
      this.transitionTo('IDLE');
    }
  }

  /** 同步 LLM 调用（开场问题用） */
  private async executeLLMCall(
    messages: { role: string; content: string }[]
  ): Promise<string> {
    const { apiMode, localApi, serverApi } = useConfigStore.getState();

    if (apiMode === 'server' && serverApi.token) {
      return aiService.chatServer(
        serverApi.baseUrl,
        serverApi.token,
        '',
        messages.map((m) => ({ role: m.role as any, content: m.content })),
        localApi.model,
        localApi.temperature,
      );
    } else {
      return aiService.chat(
        localApi,
        '',
        messages.map((m) => ({ role: m.role as any, content: m.content })),
      );
    }
  }

  /** 流式 LLM 调用 */
  private executeLLMCallWithStream(
    messages: { role: string; content: string }[]
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const { apiMode, localApi, serverApi } = useConfigStore.getState();

      const onChunk = (chunk: string) => {
        this.emit({ type: 'chunk', chunk });
      };

      const onComplete = (full: string) => resolve(full);
      const onError = (err: Error) => reject(err);

      if (apiMode === 'server' && serverApi.token) {
        aiService.streamChatServer(
          serverApi.baseUrl,
          serverApi.token,
          '',
          messages.map((m) => ({ role: m.role as any, content: m.content })),
          localApi.model,
          localApi.temperature,
          onChunk,
          onComplete,
          onError,
        );
      } else {
        aiService.streamChat(
          localApi,
          '',
          messages.map((m) => ({ role: m.role as any, content: m.content })),
          onChunk,
          onComplete,
          onError,
        );
      }
    });
  }
}

/** 导出单例 */
export const interviewAgent = new InterviewAgent();
