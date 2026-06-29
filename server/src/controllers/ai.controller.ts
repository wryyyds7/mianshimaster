import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';

export const aiController = {
  // 流式聊天
  streamChat: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messages, knowledgeIds, model, temperature } = req.body;

      // 设置SSE响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      try {
        await aiService.streamChat(
          {
            provider: 'openai',
            apiKey: process.env.OPENAI_API_KEY || '',
            baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
            model: model || process.env.AI_MODEL || 'gpt-4o',
            temperature: temperature || parseFloat(process.env.AI_TEMPERATURE || '0.7'),
            maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
          },
          messages?.[0]?.content || '',
          messages?.slice(1) || [],
          (chunk: string) => {
            res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
          },
          (fullContent: string) => {
            res.write(`data: ${JSON.stringify({ type: 'done', content: fullContent })}\n\n`);
            res.end();
          },
          (error: Error) => {
            res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
            res.end();
          }
        );
      } catch (error) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: (error as Error).message })}\n\n`);
        res.end();
      }
    } catch (error) {
      next(error);
    }
  },

  // 同步聊天
  syncChat: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { messages, model, temperature } = req.body;
      const result = await aiService.chat(
        {
          provider: 'openai',
          apiKey: process.env.OPENAI_API_KEY || '',
          baseUrl: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
          model: model || process.env.AI_MODEL || 'gpt-4o',
          temperature: temperature || parseFloat(process.env.AI_TEMPERATURE || '0.7'),
          maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
        },
        messages?.[0]?.content || '',
        messages?.slice(1) || []
      );
      res.json({ code: 0, data: result });
    } catch (error) {
      next(error);
    }
  },
};
