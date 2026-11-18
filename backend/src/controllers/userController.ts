// src/controllers/userController.ts
import { Request, Response, NextFunction } from 'express';
import { listUsers, createUserService, updateUserService } from '../services/userService';

export function listUsersController(req: Request, res: Response, next: NextFunction): void {
  try {
    const users = listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function createUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, role } = req.body;
    const user = await createUserService({ name, email, password, role });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }

    const { name, email, password, role, active } = req.body;
    const user = await updateUserService(id, { name, email, password, role, active });
    res.json(user);
  } catch (err) {
    next(err);
  }
}
