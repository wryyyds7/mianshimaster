import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const knowledgeController = {
  // 创建条目
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, content, category, tags } = req.body;
      const item = await prisma.knowledgeItem.create({
        data: {
          userId: req.user!.userId,
          title,
          content,
          category: category || '未分类',
          tags: tags || [],
        },
      });
      res.status(201).json({ code: 0, data: item });
    } catch (error) {
      next(error);
    }
  },

  // 列表
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category } = req.query;
      const where: any = { userId: req.user!.userId };
      if (category) where.category = category as string;

      const items = await prisma.knowledgeItem.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });
      res.json({ code: 0, data: items });
    } catch (error) {
      next(error);
    }
  },

  // 详情
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await prisma.knowledgeItem.findFirst({
        where: { id: req.params.id, userId: req.user!.userId },
      });
      if (!item) return res.status(404).json({ code: 404, message: '条目不存在' });
      res.json({ code: 0, data: item });
    } catch (error) {
      next(error);
    }
  },

  // 更新
  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, content, category, tags } = req.body;
      const item = await prisma.knowledgeItem.updateMany({
        where: { id: req.params.id, userId: req.user!.userId },
        data: { title, content, category, tags },
      });
      if (item.count === 0) return res.status(404).json({ code: 404, message: '条目不存在' });
      const updated = await prisma.knowledgeItem.findUnique({ where: { id: req.params.id } });
      res.json({ code: 0, data: updated });
    } catch (error) {
      next(error);
    }
  },

  // 删除
  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.knowledgeItem.deleteMany({
        where: { id: req.params.id, userId: req.user!.userId },
      });
      res.json({ code: 0, data: null, message: '已删除' });
    } catch (error) {
      next(error);
    }
  },

  // 搜索
  search: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q } = req.query;
      const items = await prisma.knowledgeItem.findMany({
        where: {
          userId: req.user!.userId,
          OR: [
            { title: { contains: q as string, mode: 'insensitive' } },
            { content: { contains: q as string, mode: 'insensitive' } },
          ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });
      res.json({ code: 0, data: items });
    } catch (error) {
      next(error);
    }
  },
};
