import { Request, Response, NextFunction } from 'express';
import { fileService } from '../services/file.service';

export const fileController = {
  upload: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(422).json({ code: 422, message: '请选择文件' });
      }

      const results = await Promise.all(
        files.map(async (file) => {
          const text = await fileService.parseContent(file.path, file.originalname);
          return {
            originalName: file.originalname,
            fileName: file.filename,
            size: file.size,
            text,
          };
        })
      );

      res.json({ code: 0, data: results });
    } catch (error) {
      next(error);
    }
  },
};
