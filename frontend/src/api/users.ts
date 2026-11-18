import apiClient from './client'
import type { User, CreateUserPayload, UpdateUserPayload } from '../types'

export async function getUsers(): Promise<User[]> {
  const res = await apiClient.get<User[]>('/users')
  return res.data
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const res = await apiClient.post<User>('/users', payload)
  return res.data
}

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<User> {
  const res = await apiClient.patch<User>(`/users/${id}`, payload)
  return res.data
}
