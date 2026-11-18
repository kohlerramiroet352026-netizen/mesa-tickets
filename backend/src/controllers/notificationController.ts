// src/controllers/notificationController.ts
import { Request, Response, NextFunction } from 'express';
import { getUserNotifications, readNotification } from '../services/notificationService';

export function listNotifications(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = req.user!;
    const notifications = getUserNotifications(user.id);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

export function markRead(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = req.user!;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }

    const notification = readNotification(id, user.id);
    res.json(notification);
  } catch (err) {
    next(err);
  }
}
