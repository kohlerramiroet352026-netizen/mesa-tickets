import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTickets } from '../api/tickets'
import type { Ticket, TicketFilters } from '../types'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Select } from '../components/common/Select'
import { Spinner } from '../components/common/Spinner'
import { EmptyState } from '../components/common/EmptyState'
import { Pagination } from '../components/common/Pagination'
import { formatDate } from '../utils/format'
import { useAuth } from '../hooks/useAuth'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'Abierto', label: 'Abierto' },
  { value: 'En progreso', label: 'En progreso' },
  { value: 'En espera', label: 'En espera' },
  { value: 'Resuelto', label: 'Resuelto' },
]
const PRIORITY_OPTIONS = [
  { value: '', label: 'Todas las prioridades' },
  { value: 'Baja', label: 'Baja' },
  { value: 'Media', label: 'Media' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Urgente', label: 'Urgente' },
]

export function MyTicketsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })

  const [filters, setFilters] = useState<TicketFilters>({
    status: '',
    priority: '',
    page: 1,
    limit: 10,
    my: true,
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getTickets(filters)
        setTickets(data.data)
        setPagination({ page: data.page, totalPages: data.totalPages, total: data.total })
      } catch {
        setError('No se pudieron cargar los tickets')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filters])

  const updateFilter = (key: keyof TicketFilters, value: string | number | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: '140px' }}>
          <Select
            options={STATUS_OPTIONS}
            value={filters.status ?? ''}
            onChange={(e) => updateFilter('status', e.target.value)}
          />
        </div>
        <div style={{ minWidth: '140px' }}>
          <Select
            options={PRIORITY_OPTIONS}
            value={filters.priority ?? ''}
            onChange={(e) => updateFilter('priority', e.target.value)}
          />
        </div>
        <Button variant="primary" onClick={() => navigate('/tickets/new')}>
          + Nuevo ticket
        </Button>
      </div>

      {/* Table */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #E2E0DC',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
            <Spinner size={28} />
          </div>
        ) : error ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#DC2626', fontSize: '14px' }}>
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState message="No tenés tickets aún. ¡Creá uno!" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F9F9F8', borderBottom: '1px solid #E2E0DC' }}>
                  {['Código', 'Título', 'Categoría', 'Prioridad', 'Estado', 'Actualizado'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 14px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: '#6B7280',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, i) => (
                  <tr
                    key={ticket.id}
                    style={{ borderBottom: i < tickets.length - 1 ? '1px solid #F5F4F2' : 'none', cursor: 'pointer' }}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#F9F9F8')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
                  >
                    <td
                      style={{
                        padding: '11px 14px',
                        fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace",
                        color: '#6B7280',
                        whiteSpace: 'nowrap',
                        fontSize: '12px',
                      }}
                    >
                      {ticket.code}
                    </td>
                    <td style={{ padding: '11px 14px', color: '#1A1A1A', fontWeight: 500, maxWidth: '280px' }}>
                      {ticket.title}
                    </td>
                    <td style={{ padding: '11px 14px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {ticket.category}
                    </td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <Badge value={ticket.priority} variant="priority" />
                    </td>
                    <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                      <Badge value={ticket.status} variant="status" />
                    </td>
                    <td
                      style={{
                        padding: '11px 14px',
                        color: '#6B7280',
                        whiteSpace: 'nowrap',
                        fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace",
                        fontSize: '12px',
                      }}
                    >
                      {formatDate(ticket.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && !error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: '#6B7280' }}>
            {pagination.total} ticket{pagination.total !== 1 ? 's' : ''}
          </span>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(p) => setFilters((prev) => ({ ...prev, page: p }))}
          />
        </div>
      )}
    </div>
  )
}
