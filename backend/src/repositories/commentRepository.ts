// src/repositories/commentRepository.ts
import { getDb } from '../database/connection';
import { Comment } from '../types';

export function createComment(data: {
  ticket_id: number;
  author_id: number;
  content: string;
  visibility: 'public' | 'internal';
}): Comment {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO comments (ticket_id, author_id, content, visibility)
    VALUES (?, ?, ?, ?)
  `).run(data.ticket_id, data.author_id, data.content, data.visibility);

  return db.prepare('SELECT * FROM comments WHERE id = ?').get(result.lastInsertRowid) as Comment;
}

export function findCommentsByTicketId(ticketId: number, includeInternal: boolean): Comment[] {
  const db = getDb();
  if (includeInternal) {
    return db.prepare(`
      SELECT c.*, u.name as author_name
      FROM comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `).all(ticketId) as Comment[];
  }
  return db.prepare(`
    SELECT c.*, u.name as author_name
    FROM comments c
    JOIN users u ON c.author_id = u.id
    WHERE c.ticket_id = ? AND c.visibility = 'public'
    ORDER BY c.created_at ASC
  `).all(ticketId) as Comment[];
}
