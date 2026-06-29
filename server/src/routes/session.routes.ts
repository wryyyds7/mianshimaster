import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', sessionController.create);
router.get('/', sessionController.list);
router.get('/:id', sessionController.getById);
router.put('/:id/end', sessionController.end);
router.delete('/:id', sessionController.remove);

export default router;
