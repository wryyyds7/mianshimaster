import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const authController = {
  // 注册
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, email, password } = req.body;
      if (!username || !email || !password) {
        return res.status(422).json({ code: 422, message: '缺少必填字段' });
      }

      const existingUser = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }] },
      });
      if (existingUser) {
        return res.status(409).json({ code: 409, message: '用户名或邮箱已存在' });
      }

      const passwordHash = await bcryptjs.hash(password, 12);
      const user = await prisma.user.create({
        data: { username, email, passwordHash },
      });

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.status(201).json({
        code: 0,
        data: {
          token,
          user: { id: user.id, username: user.username, email: user.email, role: user.role },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // 登录
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;
      const user = await prisma.user.findUnique({ where: { username } });

      if (!user || !(await bcryptjs.compare(password, user.passwordHash))) {
        return res.status(401).json({ code: 401, message: '用户名或密码错误' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        code: 0,
        data: {
          token,
          user: { id: user.id, username: user.username, email: user.email, role: user.role },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // 刷新Token
  refreshToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      // 简化实现：直接签发新token
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        return res.status(401).json({ code: 401, message: '用户不存在' });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({ code: 0, data: { token } });
    } catch {
      res.status(401).json({ code: 401, message: 'Token无效' });
    }
  },

  // 获取当前用户
  getMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { id: true, username: true, email: true, role: true },
      });
      res.json({ code: 0, data: user });
    } catch (error) {
      next(error);
    }
  },
};
