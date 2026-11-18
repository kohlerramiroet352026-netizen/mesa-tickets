export type UserRole = 'user' | 'agent' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export type TicketStatus = 'Abierto' | 'En progreso' | 'En espera' | 'Resuelto';
export type TicketPriority = 'Baja' | 'Media' | 'Alta' | 'Urgente';
export type TicketCategory = 'Consulta' | 'Problema técnico' | 'Acceso' | 'Otro';

export interface Ticket {
  id: number;
  code: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_by: number;
  created_by_name?: string;
  creator_name?: string;
  assigned_to: number | null;
  assigned_to_name?: string | null;
  assignee_name?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export type CommentVisibility = 'public' | 'internal';

export interface Comment {
  id: number;
  ticket_id: number;
  author_id: number;
  author_name?: string;
  content: string;
  visibility: CommentVisibility;
  created_at: string;
}

export interface TicketEvent {
  id: number;
  ticket_id: number;
  ticket_code?: string;
  actor_id: number;
  actor_name?: string;
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TicketFilters {
  status?: TicketStatus | '';
  priority?: TicketPriority | '';
  category?: TicketCategory | '';
  assigned_to?: number | '';
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'created_at' | 'updated_at';
  order?: 'asc' | 'desc';
  my?: boolean;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
}

export interface CreateCommentPayload {
  content: string;
  visibility: CommentVisibility;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  active?: boolean;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  active?: boolean;
}

export interface DashboardStats {
  Abierto: number;
  'En progreso': number;
  'En espera': number;
  Resuelto: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
