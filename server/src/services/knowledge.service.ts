import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class KnowledgeService {
  /**
   * 创建知识库条目
   */
  async create(
    userId: string,
    data: {
      title: string;
      content: string;
      category?: string;
      tags?: string[];
      isPublic?: boolean;
    },
  ) {
    const item = await prisma.knowledgeItem.create({
      data: {
        userId,
        title: data.title,
        content: data.content,
        category: data.category || '未分类',
        tags: data.tags || [],
        isPublic: data.isPublic ?? false,
      },
    });

    logger.info('知识库条目已创建', { id: item.id, userId });
    return item;
  }

  /**
   * 获取用户的知识库列表
   */
  async list(userId: string, offset = 0, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.knowledgeItem.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.knowledgeItem.count({ where: { userId } }),
    ]);

    return { items, total };
  }

  /**
   * 获取条目详情
   */
  async getById(id: string, userId: string) {
    const item = await prisma.knowledgeItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundError('知识库条目', id);
    }

    return item;
  }

  /**
   * 更新条目
   */
  async update(
    id: string,
    userId: string,
    data: {
      title?: string;
      content?: string;
      category?: string;
      tags?: string[];
      isPublic?: boolean;
    },
  ) {
    const item = await prisma.knowledgeItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundError('知识库条目', id);
    }

    const updated = await prisma.knowledgeItem.update({
      where: { id },
      data,
    });

    logger.info('知识库条目已更新', { id, userId });
    return updated;
  }

  /**
   * 删除条目
   */
  async remove(id: string, userId: string) {
    const item = await prisma.knowledgeItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundError('知识库条目', id);
    }

    await prisma.knowledgeItem.delete({ where: { id } });
    logger.info('知识库条目已删除', { id, userId });
  }

  /**
   * 搜索知识库
   */
  async search(userId: string, keyword: string, category?: string, offset = 0, limit = 20) {
    const where: any = {
      userId,
      OR: [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
        { tags: { has: keyword } },
      ],
    };

    if (category) {
      where.category = category;
    }

    const [items, total] = await Promise.all([
      prisma.knowledgeItem.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.knowledgeItem.count({ where }),
    ]);

    return { items, total };
  }
}

export const knowledgeService = new KnowledgeService();
