// src/types/index.ts
// Core TypeScript interfaces for Mesa ticket system

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'user' | 'agent' | 'admin';
  active: number;
  created_at: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface Ticket {
  id: number;
  code: string;
  title: string;
  description: string;
  category: 'Consulta' | 'Problema técnico' | 'Acceso' | 'Otro';
  priority: 'Baja' | 'Media' | 'Alta' | 'Urgente';
  status: 'Abierto' | 'En progreso' | 'En espera' | 'Resuelto';
  created_by: number;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface Comment {
  id: number;
  ticket_id: number;
  author_id: number;
  content: string;
  visibility: 'public' | 'internal';
  created_at: string;
}

export interface TicketEvent {
  id: number;
  ticket_id: number;
  actor_id: number;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  ticket_id: number | null;
  message: string;
  read_at: string | null;
  created_at: string;
}

// Request augmentation
export interface AuthPayload {
  id: number;
  email: string;
  role: 'user' | 'agent' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  limit?: number;
  totalPages: number;
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  assigned_to?: number;
  created_by?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}
