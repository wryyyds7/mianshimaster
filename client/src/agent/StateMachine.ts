/**
 * Agent 状态机 —— 管理对话生命周期
 * 纯状态管理，不包含业务逻辑
 */
import type { AgentState } from '@shared/types';

/** 状态转换表定义 */
type StateTransitionMap = {
  [K in AgentState]: Partial<Record<AgentState, boolean>>;
};

/** 合法的状态转换 */
const VALID_TRANSITIONS: StateTransitionMap = {
  IDLE:       { LISTENING: true, THINKING: true, RESPONDING: false },
  LISTENING:  { IDLE: true, THINKING: true, RESPONDING: false },
  THINKING:   { IDLE: true, LISTENING: false, RESPONDING: true },
  RESPONDING: { IDLE: true, LISTENING: true, THINKING: true },
};

export class StateMachine {
  private _state: AgentState = 'IDLE';

  get state(): AgentState {
    return this._state;
  }

  /** 尝试状态转换，返回是否成功 */
  transition(to: AgentState): boolean {
    const allowed = VALID_TRANSITIONS[this._state];
    if (allowed && allowed[to]) {
      this._state = to;
      return true;
    }
    return false;
  }

  /** 强制设置状态（跳过验证，用于 abort/reset） */
  force(to: AgentState): void {
    this._state = to;
  }

  /** 是否处于可接受输入的状态 */
  get canAcceptInput(): boolean {
    return this._state === 'IDLE';
  }

  /** 是否忙碌 */
  get isBusy(): boolean {
    return this._state === 'LISTENING' || this._state === 'THINKING';
  }
}
