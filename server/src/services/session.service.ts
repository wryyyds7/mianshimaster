import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class SessionService {
  /**
   * 创建面试会话
   */
  async create(userId: string, title: string) {
    const session = await prisma.session.create({
      data: {
        userId,
        title,
        status: 'ACTIVE',
        startedAt: new Date(),
      },
    });

    logger.info('会话已创建', { sessionId: session.id, userId });
    return session;
  }

  /**
   * 获取用户的会话列表
   */
  async list(userId: string, offset = 0, limit = 20) {
    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          _count: { select: { questions: true } },
        },
      }),
      prisma.session.count({ where: { userId } }),
    ]);

    return { sessions, total };
  }

  /**
   * 获取会话详情（含问题列表）
   */
  async getById(sessionId: string, userId?: string) {
    const where: any = { id: sessionId };
    if (userId) {
      where.userId = userId;
    }

    const session = await prisma.session.findFirst({
      where,
      include: {
        backgroundFiles: true,
        questions: {
          orderBy: { priority: 'desc' },
          include: {
            answers: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundError('会话', sessionId);
    }

    return session;
  }

  /**
   * 结束会话
   */
  async end(sessionId: string, userId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundError('会话', sessionId);
    }

    if (session.status === 'ENDED') {
      throw new ValidationError([{ field: 'status', message: '会话已结束' }]);
    }

    const updated = await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'ENDED', endedAt: new Date() },
    });

    logger.info('会话已结束', { sessionId, userId });
    return updated;
  }

  /**
   * 删除会话
   */
  async remove(sessionId: string, userId: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundError('会话', sessionId);
    }

    await prisma.session.delete({ where: { id: sessionId } });
    logger.info('会话已删除', { sessionId, userId });
  }

  /**
   * 创建问题（匿名提问）
   */
  async createQuestion(sessionId: string, title: string, content: string, askerId: string) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundError('会话', sessionId);
    }

    if (session.status !== 'ACTIVE') {
      throw new ValidationError([{ field: 'sessionId', message: '会话已结束，无法提交问题' }]);
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

    logger.info('新问题已提交', { questionId: question.id, sessionId });
    return question;
  }

  /**
   * 获取会话的问题列表
   */
  async listQuestions(sessionId: string, userId?: string) {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, ...(userId ? { userId } : {}) },
    });

    if (!session) {
      throw new NotFoundError('会话', sessionId);
    }

    return prisma.question.findMany({
      where: { sessionId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: { answers: true },
    });
  }
}

export const sessionService = new SessionService();
