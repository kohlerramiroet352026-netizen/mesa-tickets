import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTickets, getDashboardStats, getRecentEvents } from '../api/tickets'
import type { Ticket, DashboardStats, TicketEvent } from '../types'
import { Badge } from '../components/common/Badge'
import { Spinner } from '../components/common/Spinner'
import { formatDate } from '../utils/format'

function formatEventText(ev: TicketEvent): string {
  switch (ev.event_type) {
    case 'status_change':
    case 'status_changed':
      return `cambió el estado a "${ev.new_value}"`
    case 'priority_change':
      return `cambió la prioridad a "${ev.new_value}"`
    case 'assigned':
      return ev.new_value ? `asignó el ticket` : 'desasignó el ticket'
    case 'created':
      return 'creó el ticket'
    case 'comment_added':
      return 'agregó un comentario'
    default:
      return ev.event_type.replace(/_/g, ' ')
  }
}

export function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [myTickets, setMyTickets] = useState<Ticket[]>([])
  const [recentEvents, setRecentEvents] = useState<TicketEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoading(true)
      try {
        const [statsData, myData, eventsData] = await Promise.all([
          getDashboardStats().catch(() => null),
          getTickets({
            limit: 5,
            page: 1,
            my: user.role === 'user' ? true : undefined,
            assigned_to: user.role !== 'user' ? user.id : undefined,
          }).catch(() => ({ data: [], total: 0, page: 1, limit: 5, totalPages: 1 })),
          getRecentEvents().catch(() => []),
        ])
        setStats(statsData)
        setMyTickets(myData.data)
        setRecentEvents(eventsData)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const statCards = [
    { label: 'Abiertos', key: 'Abierto' as const, color: '#1D4ED8', bg: '#EFF6FF' },
    { label: 'En progreso', key: 'En progreso' as const, color: '#C2410C', bg: '#FFF7ED' },
    { label: 'En espera', key: 'En espera' as const, color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Resueltos', key: 'Resuelto' as const, color: '#15803D', bg: '#F0FDF4' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>
          Bienvenido, {user?.name}
        </h2>
        <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>
          Resumen del sistema de tickets
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner size={32} />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '14px',
            }}
          >
            {statCards.map((card) => (
              <div
                key={card.key}
                style={{
                  background: '#fff',
                  border: '1px solid #E2E0DC',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ fontSize: '28px', fontWeight: 700, color: card.color, marginBottom: '4px' }}>
                  {stats ? stats[card.key] ?? 0 : '—'}
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    background: card.bg,
                    color: card.color,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 500,
                    fontSize: '12px',
                  }}
                >
                  {card.label}
                </div>
              </div>
            ))}
          </div>

          {/* Recent tickets */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E2E0DC',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E2E0DC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '14px', color: '#1A1A1A' }}>
                {user?.role === 'user' ? 'Mis tickets recientes' : 'Tickets asignados a mí'}
              </span>
              <Link
                to={user?.role === 'user' ? '/my-tickets' : '/tickets'}
                style={{ fontSize: '13px', color: '#2C5F6E', textDecoration: 'none', fontWeight: 500 }}
              >
                Ver todos
              </Link>
            </div>
            {myTickets.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                No hay tickets para mostrar
              </div>
            ) : (
              <div>
                {myTickets.map((ticket, i) => (
                  <Link
                    key={ticket.id}
                    to={`/tickets/${ticket.id}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 20px',
                      borderBottom: i < myTickets.length - 1 ? '1px solid #F5F4F2' : 'none',
                      textDecoration: 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#F9F9F8')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
                  >
                    <code
                      style={{
                        fontSize: '12px',
                        color: '#6B7280',
                        fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace",
                        minWidth: '72px',
                      }}
                    >
                      {ticket.code}
                    </code>
                    <span style={{ flex: 1, fontSize: '14px', color: '#1A1A1A', fontWeight: 500 }}>
                      {ticket.title}
                    </span>
                    <Badge value={ticket.status} variant="status" />
                    <Badge value={ticket.priority} variant="priority" />
                    <span style={{ fontSize: '12px', color: '#6B7280', minWidth: '100px', textAlign: 'right' }}>
                      {formatDate(ticket.updated_at)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div
            style={{
              background: '#fff',
              border: '1px solid #E2E0DC',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E2E0DC',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1A1A1A',
              }}
            >
              Actividad reciente
            </div>
            {recentEvents.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                No hay actividad reciente registrada
              </div>
            ) : (
              <div>
                {recentEvents.map((ev, i) => (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 20px',
                      borderBottom: i < recentEvents.length - 1 ? '1px solid #F5F4F2' : 'none',
                      fontSize: '13px',
                    }}
                  >
                    {ev.ticket_code && (
                      <Link
                        to={`/tickets/${ev.ticket_id}`}
                        style={{
                          textDecoration: 'none',
                          fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace",
                          fontSize: '12px',
                          color: '#2C5F6E',
                          fontWeight: 600,
                          minWidth: '72px',
                        }}
                      >
                        {ev.ticket_code}
                      </Link>
                    )}
                    <span style={{ flex: 1, color: '#374151' }}>
                      <strong>{ev.actor_name ?? `Usuario #${ev.actor_id}`}</strong>{' '}
                      {formatEventText(ev)}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      {formatDate(ev.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
