interface EmptyStateProps {
  message?: string
  icon?: string
}

export function EmptyState({ message = 'No hay resultados', icon = '○' }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        padding: '48px 24px',
        color: '#6B7280',
      }}
    >
      <span style={{ fontSize: '32px' }}>{icon}</span>
      <p style={{ margin: 0, fontSize: '14px' }}>{message}</p>
    </div>
  )
}
