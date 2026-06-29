import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/chat', optionalAuth, aiController.streamChat);
router.post('/chat/sync', optionalAuth, aiController.syncChat);

export default router;
