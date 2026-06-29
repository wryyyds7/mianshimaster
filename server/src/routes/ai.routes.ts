import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { optionalAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validator';
import { aiChatSchema } from '../schemas/validation';

const router = Router();

router.post('/chat', optionalAuth, validateBody(aiChatSchema), aiController.streamChat);
router.post('/chat/sync', optionalAuth, validateBody(aiChatSchema), aiController.syncChat);

export default router;
