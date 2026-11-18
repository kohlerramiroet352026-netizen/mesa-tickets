// src/services/authService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, findUserById } from '../repositories/userRepository';
import { AuthPayload, SafeUser } from '../types';
import { createError } from '../middleware/errorHandler';

export async function login(email: string, password: string): Promise<{ token: string; user: SafeUser }> {
  if (!email || typeof email !== 'string') throw createError('Email requerido', 400);
  if (!password || typeof password !== 'string') throw createError('Contraseña requerida', 400);

  const user = findUserByEmail(email.toLowerCase().trim());
  if (!user) throw createError('Credenciales inválidas', 401);
  if (!user.active) throw createError('Cuenta desactivada', 403);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw createError('Credenciales inválidas', 401);

  const secret = process.env.JWT_SECRET;
  if (!secret) throw createError('Configuración del servidor incorrecta', 500);

  const payload: AuthPayload = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(payload, secret, { expiresIn: '24h' });

  const { password_hash, ...safeUser } = user;
  void password_hash;

  return { token, user: safeUser as SafeUser };
}

export function getProfile(userId: number): SafeUser {
  const user = findUserById(userId);
  if (!user) throw createError('Usuario no encontrado', 404);
  if (!user.active) throw createError('Cuenta desactivada', 403);

  const { password_hash, ...safeUser } = user;
  void password_hash;
  return safeUser as SafeUser;
}
