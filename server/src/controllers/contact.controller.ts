import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const contactController = {
  submit: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, title, content, contact } = req.body;
      const feedback = await prisma.feedback.create({
        data: { type, title, content, contact },
      });
      res.status(201).json({ code: 0, data: feedback, message: '感谢你的反馈！' });
    } catch (error) {
      next(error);
    }
  },
};
