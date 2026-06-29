import { Router } from 'express';
import { fileController } from '../controllers/file.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import multer from 'multer';
import path from 'path';

const upload = multer({
  dest: process.env.UPLOAD_DIR || './uploads',
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

const router = Router();

router.use(authMiddleware);
router.post('/upload', upload.array('files', 10), fileController.upload);

export default router;
