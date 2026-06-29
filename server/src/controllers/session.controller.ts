import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export const sessionController = {
  // 创建会话
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, fileIds } = req.body;
      const session = await prisma.session.create({
        data: {
          userId: req.user!.userId,
          title: title || `会话 ${new Date().toLocaleString('zh-CN')}`,
          status: 'ACTIVE',
          startedAt: new Date(),
        },
        include: { backgroundFiles: true, questions: { include: { answers: true } } },
      });

      res.status(201).json({ code: 0, data: session });
    } catch (error) {
      next(error);
    }
  },

  // 会话列表
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessions = await prisma.session.findMany({
        where: { userId: req.user!.userId },
        orderBy: { startedAt: 'desc' },
        include: {
          backgroundFiles: true,
          questions: {
            include: { answers: true },
            orderBy: { priority: 'desc' },
          },
        },
      });
      res.json({ code: 0, data: sessions });
    } catch (error) {
      next(error);
    }
  },

  // 会话详情
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await prisma.session.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
        include: {
          backgroundFiles: true,
          questions: {
            include: { answers: true },
            orderBy: { priority: 'desc' },
          },
        },
      });
      if (!session) {
        return res.status(404).json({ code: 404, message: '会话不存在' });
      }
      res.json({ code: 0, data: session });
    } catch (error) {
      next(error);
    }
  },

  // 结束会话
  end: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await prisma.session.update({
        where: { id: req.params.id, userId: req.user!.userId },
        data: { status: 'ENDED', endedAt: new Date() },
      });
      res.json({ code: 0, data: session });
    } catch (error) {
      next(error);
    }
  },

  // 删除会话
  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.session.delete({
        where: { id: req.params.id, userId: req.user!.userId },
      });
      res.json({ code: 0, data: null, message: '已删除' });
    } catch (error) {
      next(error);
    }
  },

  // 创建问题（提问者匿名提交）
  createQuestion: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.id;
      const { title, content } = req.body;
      // 生成匿名提问者ID
      const askerId = uuidv4();

      // 验证会话存在且活跃
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });
      if (!session) {
        return res.status(404).json({ code: 404, message: '会话不存在' });
      }
      if (session.status !== 'ACTIVE') {
        return res.status(422).json({ code: 422, message: '会话已结束，无法提交问题' });
      }

      const question = await prisma.question.create({
        data: {
          sessionId,
          askerId,
          title,
          content,
          priority: 0,
          status: 'PENDING',
        },
      });

      res.status(201).json({ code: 0, data: question });
    } catch (error) {
      next(error);
    }
  },

  // 获取会话问题列表
  listQuestions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.id;

      const session = await prisma.session.findFirst({
        where: { id: sessionId, userId: req.user!.userId },
      });
      if (!session) {
        return res.status(404).json({ code: 404, message: '会话不存在' });
      }

      const questions = await prisma.question.findMany({
        where: { sessionId },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        include: { answers: true },
      });

      res.json({ code: 0, data: questions });
    } catch (error) {
      next(error);
    }
  },
};
