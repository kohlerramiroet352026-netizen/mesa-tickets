// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { login, getProfile } from '../services/authService';

export async function loginController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export function meController(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    const user = getProfile(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export function logoutController(req: Request, res: Response): void {
  res.json({ message: 'Sesión cerrada correctamente' });
}
