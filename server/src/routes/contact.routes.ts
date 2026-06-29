import { Router } from 'express';
import { contactController } from '../controllers/contact.controller';
import { validateBody } from '../middleware/validator';
import { feedbackSchema } from '../schemas/validation';

const router = Router();

router.post('/', validateBody(feedbackSchema), contactController.submit);

export default router;
