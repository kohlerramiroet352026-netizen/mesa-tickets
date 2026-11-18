// src/routes/users.ts
import { Router } from 'express';
import {
  listUsersController,
  createUserController,
  updateUserController,
} from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authMiddleware);
router.use(authorize('admin'));

router.get('/', listUsersController);
router.post('/', createUserController);
router.patch('/:id', updateUserController);

export default router;
