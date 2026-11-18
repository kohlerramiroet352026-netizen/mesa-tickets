// src/routes/notifications.ts
import { Router } from 'express';
import { listNotifications, markRead } from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', listNotifications);
router.patch('/:id/read', markRead);

export default router;
