import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { roleLabel } from '../../utils/format'

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

interface NavItem {
  to: string
  label: string
  icon: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Panel', icon: '⊟' },
  { to: '/tickets', label: 'Todos los tickets', icon: '≡', roles: ['agent', 'admin'] },
  { to: '/my-tickets', label: 'Mis tickets', icon: '◫' },
  { to: '/users', label: 'Usuarios', icon: '◎', roles: ['admin'] },
]

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const visible = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  )

  const sidebarStyle: React.CSSProperties = {
    width: '220px',
    minWidth: '220px',
    background: '#fff',
    borderRight: '1px solid #E2E0DC',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    overflowY: 'auto',
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 100,
          }}
          className="sidebar-overlay"
        />
      )}
      <aside
        style={sidebarStyle}
        className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}
      >
        {/* Logo */}
        <div
          style={{
            padding: '20px 20px 12px',
            borderBottom: '1px solid #E2E0DC',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#2C5F6E',
              letterSpacing: '-0.5px',
            }}
          >
            Mesa
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#2C5F6E' : '#374151',
                background: isActive ? '#EEF5F7' : 'transparent',
                marginBottom: '2px',
                transition: 'background 0.12s',
              })}
            >
              <span style={{ fontSize: '16px', width: '20px', textAlign: 'center' }}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        {user && (
          <div
            style={{
              padding: '14px 16px',
              borderTop: '1px solid #E2E0DC',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1A1A', marginBottom: '1px' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>
              {roleLabel(user.role)}
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '6px',
                border: '1px solid #E2E0DC',
                borderRadius: '5px',
                background: 'transparent',
                fontSize: '12px',
                color: '#6B7280',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
