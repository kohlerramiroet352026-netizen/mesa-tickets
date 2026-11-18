import React from 'react'
import type { TicketStatus, TicketPriority } from '../../types'

type BadgeVariant = 'status' | 'priority' | 'role' | 'active'

interface BadgeProps {
  value: string
  variant?: BadgeVariant
}

function getStatusStyle(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    Abierto: { background: '#EFF6FF', color: '#1D4ED8' },
    'En progreso': { background: '#FFF7ED', color: '#C2410C' },
    'En espera': { background: '#F5F3FF', color: '#7C3AED' },
    Resuelto: { background: '#F0FDF4', color: '#15803D' },
  }
  return map[status] ?? { background: '#F3F4F6', color: '#6B7280' }
}

function getPriorityStyle(priority: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    Baja: { background: '#F9FAFB', color: '#6B7280' },
    Media: { background: '#EEF5F7', color: '#2C5F6E' },
    Alta: { background: '#FFF7ED', color: '#C2410C' },
    Urgente: { background: '#FEF2F2', color: '#DC2626' },
  }
  return map[priority] ?? { background: '#F3F4F6', color: '#6B7280' }
}

export function Badge({ value, variant = 'status' }: BadgeProps) {
  let style: React.CSSProperties = {}

  if (variant === 'status') style = getStatusStyle(value)
  else if (variant === 'priority') style = getPriorityStyle(value)
  else if (variant === 'role') {
    style = { background: '#F3F4F6', color: '#374151' }
  } else if (variant === 'active') {
    style =
      value === 'Activo' || value === 'true' || value === 'active'
        ? { background: '#F0FDF4', color: '#15803D' }
        : { background: '#FEF2F2', color: '#DC2626' }
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {value}
    </span>
  )
}
