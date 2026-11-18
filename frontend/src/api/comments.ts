import apiClient from './client'
import type { Comment, CreateCommentPayload } from '../types'

export async function getComments(ticketId: number): Promise<Comment[]> {
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
