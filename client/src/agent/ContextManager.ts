/**
 * 上下文管理器 —— 负责构建每次 LLM 调用的完整上下文
 * 纯函数设计，不依赖外部状态，便于测试和复用
 */
import type { IAgentConfig, IAgentMessage, IChatMessage } from '@shared/types';
import type { ContextBuildParams } from './types';

/** 默认系统提示词模板 */
const DEFAULT_SYSTEM_TEMPLATE = `你是一位专业的面试官。你的任务是对候选人进行一场模拟面试。

## 你的角色
{interviewRole}

## 面试风格
{interviewStyle}

## 目标岗位
{targetPosition}

## 候选人背景
{candidateResume}

## 评分标准
{evaluationCriteria}

## 行为规则
1. 每次只问一个问题，等待候选人回答后再继续
2. 根据候选人的回答质量，决定追问、切换话题或总结
3. 在回答末尾用 <!--META:{"score":<0-100>,"topics":["话题1"],"next":"follow_up|new_topic|summary|end"}--> 格式标注元数据
4. 保持专业但友善的语气
5. 面试进行 {maxRounds} 轮后自动总结并结束
6. 面试语言：{language}

## 当前进度
这是第 {currentRound}/{maxRounds} 轮面试。`;

export class ContextManager {
  /**
   * 构建系统提示词
   */
  buildSystemPrompt(config: IAgentConfig, round: number): string {
    let prompt = DEFAULT_SYSTEM_TEMPLATE
      .replace('{interviewRole}', config.interviewRole)
      .replace('{interviewStyle}', config.interviewStyle)
      .replace('{targetPosition}', config.targetPosition)
      .replace('{candidateResume}', config.candidateResume || '候选人未提供简历')
      .replace('{evaluationCriteria}', this.formatCriteria(config.evaluationCriteria))
      .replace('{maxRounds}', String(config.maxRounds))
      .replace('{language}', config.language === 'zh-CN' ? '中文' : 'English')
      .replace('{currentRound}', String(round))
      .replace('{maxRounds}', String(config.maxRounds));

    // 最后一轮时添加结束提示
    if (round >= config.maxRounds) {
      prompt += '\n\n这是最后一轮面试。请在回答中对整场面试进行总结和评估。';
    }

    return prompt;
  }

  /**
   * 构建完整的 messages 数组
   */
  build(params: ContextBuildParams): IChatMessage[] {
    const { agentConfig, history, currentMessage, round } = params;
    const systemPrompt = this.buildSystemPrompt(agentConfig, round);

    const messages: IChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // 添加最近 N 轮历史（滑动窗口，避免 token 超限）
    const recentHistory = this.getRecentHistory(history, 10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }

    // 添加当前消息
    messages.push({ role: 'user', content: currentMessage });

    return messages;
  }

  /**
   * 解析 LLM 输出，分离显示内容和元数据
   */
  parseResponse(raw: string): { displayContent: string; metadata?: import('@shared/types').IAgentMessageMeta } {
    const metaRegex = /<!--META:\s*(\{[\s\S]*?\})\s*-->/;
    const match = raw.match(metaRegex);

    if (!match) {
      return { displayContent: raw.trim() };
    }

    try {
      const metadata = JSON.parse(match[1]);
      const displayContent = raw.replace(metaRegex, '').trim();

      return {
        displayContent,
        metadata: {
          score: metadata.score,
          knowledgeTags: metadata.topics || metadata.knowledgeTags,
          nextStrategy: metadata.next,
          duration: undefined,
        },
      };
    } catch {
      return { displayContent: raw.trim() };
    }
  }

  /**
   * 获取最近 N 轮历史
   */
  private getRecentHistory(history: IAgentMessage[], maxMessages: number): IAgentMessage[] {
    return history.slice(-maxMessages);
  }

  /**
   * 格式化评分标准
   */
  private formatCriteria(criteria: string[]): string {
    if (!criteria || criteria.length === 0) {
      return '- 回答准确性\n- 沟通表达能力\n- 专业深度\n- 逻辑思维';
    }
    return criteria.map((c, i) => `${i + 1}. ${c}`).join('\n');
  }
}

/** 导出单例 */
export const contextManager = new ContextManager();
