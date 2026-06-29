import { Router } from 'express';
import { knowledgeController } from '../controllers/knowledge.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/search', knowledgeController.search);
router.post('/', knowledgeController.create);
router.get('/', knowledgeController.list);
router.get('/:id', knowledgeController.getById);
router.put('/:id', knowledgeController.update);
router.delete('/:id', knowledgeController.remove);

export default router;
