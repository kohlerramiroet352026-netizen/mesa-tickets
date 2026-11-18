// src/services/notificationService.ts
import { createNotification, findNotificationsByUserId, markNotificationRead } from '../repositories/notificationRepository';
import { findUsersByRole } from '../repositories/userRepository';
import { Notification } from '../types';
import { createError } from '../middleware/errorHandler';

export function notifyNewTicket(ticketId: number, ticketCode: string, ticketTitle: string): void {
  const admins = findUsersByRole('admin');
  const agents = findUsersByRole('agent');
  const recipients = [...admins, ...agents];
  const message = `Nuevo ticket: ${ticketCode} - ${ticketTitle}`;

  for (const r of recipients) {
    createNotification({ user_id: r.id, ticket_id: ticketId, message });
  }
}

export function notifyTicketAssigned(ticketId: number, ticketCode: string, agentId: number, urgent: boolean): void {
  const message = urgent
    ? `[URGENTE] Se te asignó el ticket ${ticketCode}`
    : `Se te asignó el ticket ${ticketCode}`;
  createNotification({ user_id: agentId, ticket_id: ticketId, message });
}

export function notifyStatusChanged(ticketId: number, ticketCode: string, creatorId: number, newStatus: string): void {
  const message = `Tu ticket ${ticketCode} cambió de estado a "${newStatus}"`;
  createNotification({ user_id: creatorId, ticket_id: ticketId, message });
}

export function notifyPublicComment(ticketId: number, ticketCode: string, creatorId: number, authorId: number): void {
  if (creatorId === authorId) return; // Don't notify self
  const message = `Nueva respuesta en tu ticket ${ticketCode}`;
  createNotification({ user_id: creatorId, ticket_id: ticketId, message });
}

export function getUserNotifications(userId: number): Notification[] {
  return findNotificationsByUserId(userId);
}

export function readNotification(id: number, userId: number): Notification {
  const notification = markNotificationRead(id, userId);
  if (!notification) throw createError('Notificación no encontrada', 404);
  return notification;
}
