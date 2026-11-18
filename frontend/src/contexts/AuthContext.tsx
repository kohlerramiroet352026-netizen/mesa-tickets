import React, { createContext, useState, useEffect, useCallback } from 'react'
import type { User } from '../types'
import { login as apiLogin, getMe, logout as apiLogout } from '../api/auth'
import { extractErrorMessage } from '../utils/format'

interface AuthContextValue {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('mesa_token')
    if (storedToken) {
      setToken(storedToken)
      getMe()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem('mesa_token')
          localStorage.removeItem('mesa_user')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    localStorage.setItem('mesa_token', data.token)
    localStorage.setItem('mesa_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // ignore
    }
    localStorage.removeItem('mesa_token')
    localStorage.removeItem('mesa_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
