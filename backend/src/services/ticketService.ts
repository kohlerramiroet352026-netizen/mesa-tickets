// src/services/ticketService.ts
import {
  createTicket,
  findTicketById,
  listTickets,
  updateTicket,
  assignTicket,
} from '../repositories/ticketRepository';
import { createEvent } from '../repositories/eventRepository';
import {
  notifyNewTicket,
  notifyTicketAssigned,
  notifyStatusChanged,
} from './notificationService';
import { findUserById } from '../repositories/userRepository';
import { Ticket, TicketFilters, PaginatedResult } from '../types';
import { createError } from '../middleware/errorHandler';

const VALID_CATEGORIES = ['Consulta', 'Problema técnico', 'Acceso', 'Otro'];
const VALID_PRIORITIES = ['Baja', 'Media', 'Alta', 'Urgente'];
const VALID_STATUSES = ['Abierto', 'En progreso', 'En espera', 'Resuelto'];

export function createTicketService(data: {
  title: string;
  description: string;
  category: string;
  priority: string;
  created_by: number;
}): Ticket {
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
    throw createError('El título debe tener al menos 3 caracteres', 400);
  }
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length < 5) {
    throw createError('La descripción debe tener al menos 5 caracteres', 400);
  }
  if (!VALID_CATEGORIES.includes(data.category)) {
    throw createError(`Categoría inválida. Opciones: ${VALID_CATEGORIES.join(', ')}`, 400);
  }
  if (!VALID_PRIORITIES.includes(data.priority)) {
    throw createError(`Prioridad inválida. Opciones: ${VALID_PRIORITIES.join(', ')}`, 400);
  }

  const ticket = createTicket({
    title: data.title.trim(),
    description: data.description.trim(),
    category: data.category,
    priority: data.priority,
    created_by: data.created_by,
  });

  createEvent({
    ticket_id: ticket.id,
    actor_id: data.created_by,
    event_type: 'created',
    new_value: ticket.code,
  });

  notifyNewTicket(ticket.id, ticket.code, ticket.title);

  return ticket;
}

export function getTicket(id: number, userId: number, role: string): Ticket {
  const ticket = findTicketById(id);
  if (!ticket) throw createError('Ticket no encontrado', 404);

  if (role === 'user' && ticket.created_by !== userId) {
    throw createError('No tienes acceso a este ticket', 403);
  }

  return ticket;
}

export function listTicketsService(
  filters: TicketFilters,
  userId: number,
  role: string
): PaginatedResult<Ticket> {
  return listTickets(filters, userId, role);
}

export function updateTicketService(
  id: number,
  userId: number,
  role: string,
  fields: Partial<{
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
  }>
): Ticket {
  const ticket = findTicketById(id);
  if (!ticket) throw createError('Ticket no encontrado', 404);

  if (role === 'user' && ticket.created_by !== userId) {
    throw createError('No tienes acceso a este ticket', 403);
  }

  if (fields.category && !VALID_CATEGORIES.includes(fields.category)) {
    throw createError(`Categoría inválida. Opciones: ${VALID_CATEGORIES.join(', ')}`, 400);
  }
  if (fields.priority && !VALID_PRIORITIES.includes(fields.priority)) {
    throw createError(`Prioridad inválida. Opciones: ${VALID_PRIORITIES.join(', ')}`, 400);
  }
  if (fields.status && !VALID_STATUSES.includes(fields.status)) {
    throw createError(`Estado inválido. Opciones: ${VALID_STATUSES.join(', ')}`, 400);
  }

  const updateData: Parameters<typeof updateTicket>[1] = { ...fields };

  if (fields.status) {
    if (fields.status === 'Resuelto' && ticket.status !== 'Resuelto') {
      updateData.resolved_at = new Date().toISOString();
    } else if (fields.status !== 'Resuelto' && ticket.status === 'Resuelto') {
      updateData.resolved_at = null;
    }

    if (fields.status !== ticket.status) {
      createEvent({
        ticket_id: id,
        actor_id: userId,
        event_type: 'status_changed',
        old_value: ticket.status,
        new_value: fields.status,
      });
      notifyStatusChanged(id, ticket.code, ticket.created_by, fields.status);
    }
  }

  const updated = updateTicket(id, updateData);
  if (!updated) throw createError('Error al actualizar el ticket', 500);
  return updated;
}

export function assignTicketService(
  ticketId: number,
  agentId: number,
  actorId: number
): Ticket {
  const ticket = findTicketById(ticketId);
  if (!ticket) throw createError('Ticket no encontrado', 404);

  const agent = findUserById(agentId);
  if (!agent || (agent.role !== 'agent' && agent.role !== 'admin')) {
    throw createError('El usuario asignado debe ser agente o admin', 400);
  }

  const updated = assignTicket(ticketId, agentId);
  if (!updated) throw createError('Error al asignar el ticket', 500);

  createEvent({
    ticket_id: ticketId,
    actor_id: actorId,
    event_type: 'assigned',
    old_value: ticket.assigned_to ? String(ticket.assigned_to) : null,
    new_value: String(agentId),
  });

  const isUrgent = ticket.priority === 'Urgente';
  notifyTicketAssigned(ticketId, ticket.code, agentId, isUrgent);

  return updated;
}
