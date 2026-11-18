// src/services/userService.ts
import bcrypt from 'bcryptjs';
import { findAllUsers, createUser, updateUser, findUserById } from '../repositories/userRepository';
import { SafeUser } from '../types';
import { createError } from '../middleware/errorHandler';

const VALID_ROLES = ['user', 'agent', 'admin'];

export function listUsers(): SafeUser[] {
  return findAllUsers();
}

export async function createUserService(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<SafeUser> {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
    throw createError('El nombre debe tener al menos 2 caracteres', 400);
  }
  if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
    throw createError('Email inválido', 400);
  }
  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    throw createError('La contraseña debe tener al menos 6 caracteres', 400);
  }
  if (!VALID_ROLES.includes(data.role)) {
    throw createError(`Rol inválido. Opciones: ${VALID_ROLES.join(', ')}`, 400);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  try {
    return createUser(data.name.trim(), data.email.toLowerCase().trim(), passwordHash, data.role as 'user' | 'agent' | 'admin');
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
      throw createError('El email ya está registrado', 409);
    }
    throw err;
  }
}

export async function updateUserService(
  id: number,
  data: Partial<{ name: string; email: string; password: string; role: string; active: number }>
): Promise<SafeUser> {
  const existing = findUserById(id);
  if (!existing) throw createError('Usuario no encontrado', 404);

  if (data.role && !VALID_ROLES.includes(data.role)) {
    throw createError(`Rol inválido. Opciones: ${VALID_ROLES.join(', ')}`, 400);
  }
  if (data.email && !data.email.includes('@')) {
    throw createError('Email inválido', 400);
  }

  const fields: Parameters<typeof updateUser>[1] = {};
  if (data.name) fields.name = data.name.trim();
  if (data.email) fields.email = data.email.toLowerCase().trim();
  if (data.role) fields.role = data.role;
  if (data.active !== undefined) fields.active = data.active;
  if (data.password) fields.password_hash = await bcrypt.hash(data.password, 10);

  const updated = updateUser(id, fields);
  if (!updated) throw createError('Error al actualizar el usuario', 500);
  return updated;
}
