// src/controllers/commentController.ts
import { Request, Response, NextFunction } from 'express';
import { getComments } from '../services/commentService';

export function listComments(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = req.user!;
    const ticket_id = parseInt(req.params.id, 10);
    if (isNaN(ticket_id)) { res.status(400).json({ error: 'ID inválido' }); return; }

    const comments = getComments(ticket_id, user.role, user.id);
    res.json(comments);
  } catch (err) {
    next(err);
  }
}
