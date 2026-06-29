import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate, validateBody, validateParams } from '../middleware/validator';
import { createSessionSchema, sessionIdParam, createQuestionSchema } from '../schemas/validation';

const router = Router();

router.use(authMiddleware);

router.post('/', validateBody(createSessionSchema), sessionController.create);
router.get('/', sessionController.list);
router.get('/:id', validateParams(sessionIdParam), sessionController.getById);
router.put('/:id/end', validateParams(sessionIdParam), sessionController.end);
router.delete('/:id', validateParams(sessionIdParam), sessionController.remove);

// 问题子路由（提问者匿名提交）
router.post('/:id/questions', validateParams(sessionIdParam), validateBody(createQuestionSchema), sessionController.createQuestion);
router.get('/:id/questions', validateParams(sessionIdParam), sessionController.listQuestions);

export default router;
