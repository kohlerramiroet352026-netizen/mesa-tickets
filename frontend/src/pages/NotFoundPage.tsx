import { Link } from 'react-router-dom'
import { Button } from '../components/common/Button'

export function NotFoundPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '48px', margin: 0, color: '#2C5F6E' }}>404</h1>
      <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>
        Página no encontrada
      </p>
      <Link to="/dashboard" style={{ textDecoration: 'none' }}>
        <Button variant="primary">Volver al panel</Button>
      </Link>
    </div>
  )
}
