import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validator';
import { registerSchema, loginSchema, refreshTokenSchema } from '../schemas/validation';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/refresh', validateBody(refreshTokenSchema), authController.refreshToken);
router.get('/me', authMiddleware, authController.getMe);

export default router;
