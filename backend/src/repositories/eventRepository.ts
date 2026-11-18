// src/repositories/eventRepository.ts
import { getDb } from '../database/connection';
import { TicketEvent } from '../types';

export function createEvent(data: {
  ticket_id: number;
  actor_id: number;
  event_type: string;
  old_value?: string | null;
  new_value?: string | null;
}): TicketEvent {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO ticket_events (ticket_id, actor_id, event_type, old_value, new_value)
    VALUES (?, ?, ?, ?, ?)
  `).run(data.ticket_id, data.actor_id, data.event_type, data.old_value ?? null, data.new_value ?? null);

  return db.prepare('SELECT * FROM ticket_events WHERE id = ?').get(result.lastInsertRowid) as TicketEvent;
}

export function findEventsByTicketId(ticketId: number): TicketEvent[] {
  const db = getDb();
  return db.prepare(`
    SELECT e.*, u.name as actor_name
    FROM ticket_events e
    JOIN users u ON e.actor_id = u.id
    WHERE e.ticket_id = ?
    ORDER BY e.created_at ASC
  `).all(ticketId) as TicketEvent[];
}
