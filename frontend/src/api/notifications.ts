import apiClient from './client'
import type { Notification } from '../types'

export async function getNotifications(): Promise<Notification[]> {
  const res = await apiClient.get<Notification[]>('/notifications')
  return res.data
}

export async function markNotificationRead(id: number): Promise<void> {
  await apiClient.patch(`/notifications/${id}/read`)
}
