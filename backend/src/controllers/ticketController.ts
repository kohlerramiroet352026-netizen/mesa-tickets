// src/controllers/ticketController.ts
import { Request, Response, NextFunction } from 'express';
import {
  createTicketService,
  getTicket,
  listTicketsService,
  updateTicketService,
  assignTicketService,
} from '../services/ticketService';
import { addComment, getComments } from '../services/commentService';
import { TicketFilters } from '../types';

export function listTickets(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = req.user!;
    const filters: TicketFilters = {
      status: req.query.status as string,
      priority: req.query.priority as string,
      category: req.query.category as string,
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      pageSize: req.query.pageSize
        ? parseInt(req.query.pageSize as string, 10)
        : req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 20,
    };
    if (req.query.assigned_to) filters.assigned_to = parseInt(req.query.assigned_to as string, 10);
    if (req.query.created_by) filters.created_by = parseInt(req.query.created_by as string, 10);

    const result = listTicketsService(filters, user.id, user.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const { title, description, category, priority } = req.body;
    const ticket = createTicketService({ title, description, category, priority, created_by: user.id });
    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
}

export function getTicketById(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = req.user!;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }
    const ticket = getTicket(id, user.id, user.role);
    res.json(ticket);
  } catch (err) {
    next(err);
  }
}

export function updateTicket(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = req.user!;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }

    const { title, description, category, priority, status } = req.body;
    const ticket = updateTicketService(id, user.id, user.role, {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
    });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
}

export function assignTicket(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = req.user!;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) { res.status(400).json({ error: 'ID inválido' }); return; }

    const { agent_id } = req.body;
    if (!agent_id || isNaN(parseInt(agent_id, 10))) {
      res.status(400).json({ error: 'agent_id requerido' });
      return;
    }

    const ticket = assignTicketService(id, parseInt(agent_id, 10), user.id);
    res.json(ticket);
  } catch (err) {
    next(err);
  }
}

export function addCommentController(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = req.user!;
    const ticket_id = parseInt(req.params.id, 10);
    if (isNaN(ticket_id)) { res.status(400).json({ error: 'ID inválido' }); return; }

    const { content, visibility = 'public' } = req.body;
    const comment = addComment({
      ticket_id,
      author_id: user.id,
      content,
      visibility,
      role: user.role,
    });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}
