// src/repositories/notificationRepository.ts
import { getDb } from '../database/connection';
import { Notification } from '../types';

export function createNotification(data: {
  user_id: number;
  ticket_id?: number;
  message: string;
}): Notification {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO notifications (user_id, ticket_id, message)
    VALUES (?, ?, ?)
  `).run(data.user_id, data.ticket_id ?? null, data.message);

  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid) as Notification;
}

export function findNotificationsByUserId(userId: number): Notification[] {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM notifications WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as Notification[];
}

export function findNotificationById(id: number): Notification | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as Notification | undefined;
}

export function markNotificationRead(id: number, userId: number): Notification | undefined {
  const db = getDb();
  db.prepare(`
    UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ?
  `).run(id, userId);
  return findNotificationById(id);
}
