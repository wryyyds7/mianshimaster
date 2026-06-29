import { Router } from 'express';
import authRoutes from './auth.routes';
import sessionRoutes from './session.routes';
import knowledgeRoutes from './knowledge.routes';
import aiRoutes from './ai.routes';
import fileRoutes from './file.routes';
import contactRoutes from './contact.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/sessions', sessionRoutes);
router.use('/knowledge', knowledgeRoutes);
router.use('/ai', aiRoutes);
router.use('/files', fileRoutes);
router.use('/feedback', contactRoutes);

export default router;
