import apiClient from './client'
import type {
  Ticket,
  CreateTicketPayload,
  UpdateTicketPayload,
  TicketFilters,
  PaginatedResponse,
  Comment,
  CreateCommentPayload,
  TicketEvent,
  DashboardStats,
} from '../types'

export async function getTickets(
  filters: TicketFilters = {}
): Promise<PaginatedResponse<Ticket>> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined)
  )
  const res = await apiClient.get<PaginatedResponse<Ticket>>('/tickets', { params })
  return res.data
}

export async function getTicket(id: number): Promise<Ticket> {
  const res = await apiClient.get<Ticket>(`/tickets/${id}`)
  return res.data
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const res = await apiClient.post<Ticket>('/tickets', payload)
  return res.data
}

export async function updateTicket(id: number, payload: UpdateTicketPayload): Promise<Ticket> {
  const res = await apiClient.patch<Ticket>(`/tickets/${id}`, payload)
  return res.data
}

export async function assignTicket(id: number, agentId: number): Promise<Ticket> {
  const res = await apiClient.post<Ticket>(`/tickets/${id}/assign`, { agent_id: agentId })
  return res.data
}

export async function getTicketComments(ticketId: number): Promise<Comment[]> {
  const res = await apiClient.get<Comment[]>(`/tickets/${ticketId}/comments`)
  return res.data
}

export async function addComment(
  ticketId: number,
  payload: CreateCommentPayload
): Promise<Comment> {
  const res = await apiClient.post<Comment>(`/tickets/${ticketId}/comments`, payload)
  return res.data
}

export async function getTicketEvents(ticketId: number): Promise<TicketEvent[]> {
  const res = await apiClient.get<TicketEvent[]>(`/tickets/${ticketId}/events`)
  return res.data
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<DashboardStats>('/tickets/stats')
  return res.data
}

export async function getRecentEvents(): Promise<TicketEvent[]> {
  const res = await apiClient.get<TicketEvent[]>('/tickets/events/recent')
  return res.data
}
