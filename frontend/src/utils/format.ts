export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(isoString: string | null | undefined): string {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function timeAgo(isoString: string): string {
  const now = new Date()
  const then = new Date(isoString)
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'hace un momento'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`
  const diffD = Math.floor(diffH / 24)
  return `hace ${diffD} d`
}

export function priorityLabel(priority: string): string {
  const map: Record<string, string> = {
    Baja: 'Baja',
    Media: 'Media',
    Alta: 'Alta',
    Urgente: 'Urgente',
  }
  return map[priority] ?? priority
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    Abierto: 'Abierto',
    'En progreso': 'En progreso',
    'En espera': 'En espera',
    Resuelto: 'Resuelto',
  }
  return map[status] ?? status
}

export function roleLabel(role: string): string {
  const map: Record<string, string> = {
    user: 'Usuario',
    agent: 'Agente',
    admin: 'Admin',
  }
  return map[role] ?? role
}

export function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axErr = err as { response?: { data?: { error?: string; message?: string } } }
    return (
      axErr.response?.data?.error ??
      axErr.response?.data?.message ??
      'Error inesperado'
    )
  }
  if (err instanceof Error) return err.message
  return 'Error inesperado'
}
