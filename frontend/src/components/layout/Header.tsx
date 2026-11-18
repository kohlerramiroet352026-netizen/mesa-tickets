import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'
import { formatDate } from '../../utils/format'

interface HeaderProps {
  title: string
  onMenuToggle: () => void
}

export function Header({ title, onMenuToggle }: HeaderProps) {
  const { notifications, unreadCount, markRead } = useNotifications()
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header
      style={{
        height: '56px',
        background: '#fff',
        borderBottom: '1px solid #E2E0DC',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: '14px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Hamburger - mobile only */}
      <button
        className="hamburger-btn"
        onClick={onMenuToggle}
        aria-label="Abrir menú"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: '#374151',
          fontSize: '20px',
          display: 'none',
        }}
      >
        &#9776;
      </button>

      <h1
        style={{
          flex: 1,
          margin: 0,
          fontSize: '16px',
          fontWeight: 600,
          color: '#1A1A1A',
        }}
      >
        {title}
      </h1>

      {/* Bell */}
      <div ref={bellRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setBellOpen((o) => !o)}
          aria-label="Notificaciones"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '6px',
            color: '#374151',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '0',
                right: '0',
                background: '#DC2626',
                color: '#fff',
                borderRadius: '50%',
                fontSize: '10px',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {bellOpen && (
          <div
            style={{
              position: 'absolute',
              top: '40px',
              right: 0,
              background: '#fff',
              border: '1px solid #E2E0DC',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              width: '320px',
              maxHeight: '360px',
              overflowY: 'auto',
              zIndex: 200,
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #E2E0DC',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1A1A1A',
              }}
            >
              Notificaciones
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
                Sin notificaciones
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read_at) markRead(n.id)
                    if (n.ticket_id) {
                      navigate(`/tickets/${n.ticket_id}`)
                      setBellOpen(false)
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    borderBottom: '1px solid #F5F4F2',
                    cursor: n.ticket_id ? 'pointer' : 'default',
                    background: n.read_at ? '#fff' : '#F0F9FF',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#1A1A1A' }}>{n.message}</span>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                    {formatDate(n.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </header>
  )
}
