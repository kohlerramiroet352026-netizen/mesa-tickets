import apiClient from './client'
import type { AuthResponse, User } from '../types'

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login', { email, password })
  return res.data
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get<User>('/auth/me')
  return res.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}
