import { useState, useEffect, useRef, useCallback } from 'react'
import type { Notification } from '../types'
import { getNotifications, markNotificationRead } from '../api/notifications'
import { useAuth } from './useAuth'

const POLL_INTERVAL = 30_000

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch {
      // silent fail
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    fetchNotifications()
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user, fetchNotifications])

  const markRead = useCallback(
    async (id: number) => {
      try {
        await markNotificationRead(id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
        )
      } catch {
        // silent fail
      }
    },
    []
  )

  const unreadCount = notifications.filter((n) => !n.read_at).length

  return { notifications, unreadCount, markRead, refetch: fetchNotifications }
}
