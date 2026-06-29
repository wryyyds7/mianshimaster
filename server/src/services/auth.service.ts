import { PrismaClient } from '@prisma/client';
import { hashPassword, verifyPassword } from '../utils/hash';
import { signAccessToken, signRefreshToken, verifyToken, JwtPayload } from '../utils/jwt';
import { UnauthorizedError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class AuthService {
  /**
   * 用户注册
   */
  async register(username: string, email: string, password: string) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      throw new ValidationError([{ field: 'username', message: '用户名或邮箱已存在' }]);
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });

    logger.info('用户注册成功', { userId: user.id, username });
    return user;
  }

  /**
   * 用户登录
   */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: user.id });

    logger.info('用户登录成功', { userId: user.id });
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * 刷新Token
   */
  async refreshToken(refreshTokenStr: string) {
    const decoded = verifyToken(refreshTokenStr);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      accessToken: signAccessToken(payload),
    };
  }

  /**
   * 获取当前用户信息
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      throw new UnauthorizedError('用户不存在');
    }

    return user;
  }
}

export const authService = new AuthService();
