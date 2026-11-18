import { useState, useCallback } from 'react'
import type { Ticket, TicketFilters, PaginatedResponse } from '../types'
import { getTickets } from '../api/tickets'

export function useTickets(initialFilters: TicketFilters = {}) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TicketFilters>(initialFilters)

  const fetch = useCallback(
    async (overrides: TicketFilters = {}) => {
      setLoading(true)
      setError(null)
      try {
        const merged: TicketFilters = { ...filters, ...overrides }
        const data: PaginatedResponse<Ticket> = await getTickets(merged)
        setTickets(data.data)
        setPagination({ total: data.total, page: data.page, limit: data.limit, totalPages: data.totalPages })
      } catch (e) {
        setError('No se pudieron cargar los tickets')
        console.error(e)
      } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  const updateFilters = useCallback((updates: TicketFilters) => {
    setFilters((prev) => ({ ...prev, ...updates }))
  }, [])

  return { tickets, pagination, loading, error, filters, fetch, updateFilters, setFilters }
}
