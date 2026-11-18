// src/repositories/ticketRepository.ts
import { getDb } from '../database/connection';
import { Ticket, TicketFilters, PaginatedResult } from '../types';

export function getNextTicketCode(): string {
  const db = getDb();
  const row = db.prepare("SELECT code FROM tickets ORDER BY id DESC LIMIT 1").get() as { code: string } | undefined;
  if (!row) return 'TCK-0001';
  const num = parseInt(row.code.split('-')[1], 10) + 1;
  return `TCK-${String(num).padStart(4, '0')}`;
}

export function createTicket(data: {
  title: string;
  description: string;
  category: string;
  priority: string;
  created_by: number;
}): Ticket {
  const db = getDb();
  const code = getNextTicketCode();

  const result = db.prepare(`
    INSERT INTO tickets (code, title, description, category, priority, status, created_by)
    VALUES (?, ?, ?, ?, ?, 'Abierto', ?)
  `).run(code, data.title, data.description, data.category, data.priority, data.created_by);

  return db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid) as Ticket;
}

export function findTicketById(id: number): Ticket | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT t.*, 
           u1.name as creator_name,
           u2.name as assignee_name
    FROM tickets t
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.assigned_to = u2.id
    WHERE t.id = ?
  `).get(id) as Ticket | undefined;
}

export function listTickets(filters: TicketFilters, userId: number, role: string): PaginatedResult<Ticket> {
  const db = getDb();
  const page = Math.max(1, filters.page || 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize || 20));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const params: unknown[] = [];

  // Role-based restriction
  if (role === 'user') {
    conditions.push('t.created_by = ?');
    params.push(userId);
  }

  if (filters.status) { conditions.push('t.status = ?'); params.push(filters.status); }
  if (filters.priority) { conditions.push('t.priority = ?'); params.push(filters.priority); }
  if (filters.category) { conditions.push('t.category = ?'); params.push(filters.category); }
  if (filters.assigned_to !== undefined) { conditions.push('t.assigned_to = ?'); params.push(filters.assigned_to); }
  if (filters.created_by !== undefined && role !== 'user') { conditions.push('t.created_by = ?'); params.push(filters.created_by); }
  if (filters.search) {
    conditions.push('(t.title LIKE ? OR t.description LIKE ? OR t.code LIKE ?)');
    const like = `%${filters.search}%`;
    params.push(like, like, like);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRow = db.prepare(`SELECT COUNT(*) as count FROM tickets t ${where}`).get(...params) as { count: number };
  const total = countRow.count;

  const data = db.prepare(`
    SELECT t.*, 
           u1.name as creator_name,
           u2.name as assignee_name
    FROM tickets t
    LEFT JOIN users u1 ON t.created_by = u1.id
    LEFT JOIN users u2 ON t.assigned_to = u2.id
    ${where}
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset) as Ticket[];

  return {
    data,
    total,
    page,
    pageSize,
    limit: pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export function updateTicket(
  id: number,
  fields: Partial<{
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    assigned_to: number | null;
    resolved_at: string | null;
  }>
): Ticket | undefined {
  const db = getDb();

  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (fields.title !== undefined) { setClauses.push('title = ?'); values.push(fields.title); }
  if (fields.description !== undefined) { setClauses.push('description = ?'); values.push(fields.description); }
  if (fields.category !== undefined) { setClauses.push('category = ?'); values.push(fields.category); }
  if (fields.priority !== undefined) { setClauses.push('priority = ?'); values.push(fields.priority); }
  if (fields.status !== undefined) { setClauses.push('status = ?'); values.push(fields.status); }
  if ('assigned_to' in fields) { setClauses.push('assigned_to = ?'); values.push(fields.assigned_to ?? null); }
  if ('resolved_at' in fields) { setClauses.push('resolved_at = ?'); values.push(fields.resolved_at ?? null); }

  if (setClauses.length === 0) return findTicketById(id);

  setClauses.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE tickets SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);
  return findTicketById(id);
}

export function assignTicket(ticketId: number, agentId: number): Ticket | undefined {
  const db = getDb();
  db.prepare("UPDATE tickets SET assigned_to = ?, updated_at = datetime('now') WHERE id = ?").run(agentId, ticketId);
  return findTicketById(ticketId);
}
