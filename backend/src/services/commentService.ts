// src/services/commentService.ts
import { createComment, findCommentsByTicketId } from '../repositories/commentRepository';
import { findTicketById } from '../repositories/ticketRepository';
import { createEvent } from '../repositories/eventRepository';
import { notifyPublicComment } from './notificationService';
import { Comment } from '../types';
import { createError } from '../middleware/errorHandler';

export function addComment(data: {
  ticket_id: number;
  author_id: number;
  content: string;
  visibility: string;
  role: string;
}): Comment {
  const ticket = findTicketById(data.ticket_id);
  if (!ticket) throw createError('Ticket no encontrado', 404);

  if (!data.content || typeof data.content !== 'string' || data.content.trim().length < 1) {
    throw createError('El contenido del comentario es requerido', 400);
  }
  if (!['public', 'internal'].includes(data.visibility)) {
    throw createError('Visibilidad inválida. Opciones: public, internal', 400);
  }

  // Users cannot add internal comments
  if (data.role === 'user' && data.visibility === 'internal') {
    throw createError('No tienes permiso para agregar notas internas', 403);
  }

  const comment = createComment({
    ticket_id: data.ticket_id,
    author_id: data.author_id,
    content: data.content.trim(),
    visibility: data.visibility as 'public' | 'internal',
  });

  createEvent({
    ticket_id: data.ticket_id,
    actor_id: data.author_id,
    event_type: 'comment_added',
    new_value: data.visibility,
  });

  if (data.visibility === 'public') {
    notifyPublicComment(data.ticket_id, ticket.code, ticket.created_by, data.author_id);
  }

  return comment;
}

export function getComments(ticketId: number, role: string, userId: number): Comment[] {
  const ticket = findTicketById(ticketId);
  if (!ticket) throw createError('Ticket no encontrado', 404);

  // Users can only see their own tickets' comments
  if (role === 'user' && ticket.created_by !== userId) {
    throw createError('No tienes acceso a este ticket', 403);
  }

  const includeInternal = role !== 'user';
  return findCommentsByTicketId(ticketId, includeInternal);
}
