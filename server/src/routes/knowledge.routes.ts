import { Router } from 'express';
import { knowledgeController } from '../controllers/knowledge.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validator';
import {
  createKnowledgeSchema,
  updateKnowledgeSchema,
  knowledgeSearchSchema,
  knowledgeIdParam,
} from '../schemas/validation';

const router = Router();

router.use(authMiddleware);

router.get('/search', validateQuery(knowledgeSearchSchema), knowledgeController.search);
router.post('/', validateBody(createKnowledgeSchema), knowledgeController.create);
router.get('/', knowledgeController.list);
router.get('/:id', validateParams(knowledgeIdParam), knowledgeController.getById);
router.put('/:id', validateParams(knowledgeIdParam), validateBody(updateKnowledgeSchema), knowledgeController.update);
router.delete('/:id', validateParams(knowledgeIdParam), knowledgeController.remove);

export default router;
