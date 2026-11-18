// src/routes/auth.ts
import { Router } from 'express';
import { loginController, meController, logoutController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', loginController);
router.get('/me', authMiddleware, meController);
router.post('/logout', authMiddleware, logoutController);

export default router;
