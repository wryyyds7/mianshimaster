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
};
