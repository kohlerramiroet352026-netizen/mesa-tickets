// src/repositories/userRepository.ts
import { getDb } from '../database/connection';
import { User, SafeUser } from '../types';

export function findUserByEmail(email: string): User | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
}

export function findUserById(id: number): User | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function findAllUsers(): SafeUser[] {
  const db = getDb();
  return db
    .prepare('SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC')
    .all() as SafeUser[];
}

export function findUsersByRole(role: string): SafeUser[] {
  const db = getDb();
  return db
    .prepare('SELECT id, name, email, role, active, created_at FROM users WHERE role = ? AND active = 1')
    .all(role) as SafeUser[];
}

export function createUser(
  name: string,
  email: string,
  passwordHash: string,
  role: 'user' | 'agent' | 'admin'
): SafeUser {
  const db = getDb();
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name, email, passwordHash, role);

  const user = db
    .prepare('SELECT id, name, email, role, active, created_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid) as SafeUser;

  return user;
}

export function updateUser(
  id: number,
  fields: Partial<{ name: string; email: string; role: string; active: number; password_hash: string }>
): SafeUser | undefined {
  const db = getDb();

  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (fields.name !== undefined) { setClauses.push('name = ?'); values.push(fields.name); }
  if (fields.email !== undefined) { setClauses.push('email = ?'); values.push(fields.email); }
  if (fields.role !== undefined) { setClauses.push('role = ?'); values.push(fields.role); }
  if (fields.active !== undefined) { setClauses.push('active = ?'); values.push(fields.active); }
  if (fields.password_hash !== undefined) { setClauses.push('password_hash = ?'); values.push(fields.password_hash); }

  if (setClauses.length === 0) return findUserById(id) ? (db.prepare('SELECT id, name, email, role, active, created_at FROM users WHERE id = ?').get(id) as SafeUser) : undefined;

  values.push(id);
  db.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

  return db
    .prepare('SELECT id, name, email, role, active, created_at FROM users WHERE id = ?')
    .get(id) as SafeUser | undefined;
}
