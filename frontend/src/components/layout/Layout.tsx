import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Panel',
  '/tickets': 'Todos los tickets',
  '/my-tickets': 'Mis tickets',
  '/users': 'Usuarios',
}

function getTitle(pathname: string): string {
  if (pathname.startsWith('/tickets/') && pathname !== '/tickets') return 'Detalle del ticket'
  if (pathname === '/tickets/new') return 'Nuevo ticket'
  return pageTitles[pathname] ?? 'Mesa'
}

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F4F2' }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          title={getTitle(location.pathname)}
          onMenuToggle={() => setMobileOpen((o) => !o)}
        />
        <main
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
