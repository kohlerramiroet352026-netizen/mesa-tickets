// src/routes/tickets.ts
import { Router } from 'express';
import {
  listTickets,
  createTicket,
  getTicketById,
  updateTicket,
  assignTicket,
  addCommentController,
} from '../controllers/ticketController';
import { listComments } from '../controllers/commentController';
import { findEventsByTicketId } from '../repositories/eventRepository';
import { getDb } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

router.use(authMiddleware);

// Stats (must be before /:id)
router.get('/stats', (req, res, next) => {
  try {
    const db = getDb();
    const user = req.user!;
    let query = 'SELECT status, COUNT(*) as count FROM tickets';
    const params: unknown[] = [];
    if (user.role === 'user') {
      query += ' WHERE created_by = ?';
      params.push(user.id);
    }
    query += ' GROUP BY status';
    const rows = db.prepare(query).all(...params) as { status: string; count: number }[];
    const stats: Record<string, number> = {
      Abierto: 0,
      'En progreso': 0,
      'En espera': 0,
      Resuelto: 0,
    };
    for (const r of rows) {
      if (r.status in stats) stats[r.status] = r.count;
    }
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// Recent events for dashboard (must be before /:id)
router.get('/events/recent', (req, res, next) => {
  try {
    const db = getDb();
    const user = req.user!;
    let query = `
      SELECT e.*, u.name as actor_name, t.code as ticket_code
      FROM ticket_events e
      JOIN users u ON e.actor_id = u.id
      JOIN tickets t ON e.ticket_id = t.id
    `;
    const params: unknown[] = [];
    if (user.role === 'user') {
      query += ' WHERE t.created_by = ?';
      params.push(user.id);
    }
    query += ' ORDER BY e.created_at DESC LIMIT 5';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/', listTickets);
router.post('/', createTicket);
router.get('/:id', getTicketById);
router.patch('/:id', updateTicket);
router.post('/:id/assign', authorize('agent', 'admin'), assignTicket);
router.get('/:id/comments', listComments);
router.post('/:id/comments', addCommentController);
router.get('/:id/events', (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) { res.status(400).json({ error: 'ID inválido' }); return; }
    const events = findEventsByTicketId(ticketId);
    res.json(events);
  } catch (err) {
    next(err);
  }
});

export default router;
