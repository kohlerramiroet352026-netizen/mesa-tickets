import { useEffect, useState } from 'react'

export type NotificationKind = 'success' | 'error' | 'warning' | 'info'

interface NotificationProps {
  message: string
  kind?: NotificationKind
  duration?: number
  onClose?: () => void
}

const kindStyles: Record<NotificationKind, { background: string; color: string; border: string }> = {
  success: { background: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  error: { background: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  warning: { background: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
  info: { background: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
}

export function Notification({ message, kind = 'info', duration = 3500, onClose }: NotificationProps) {
  const [visible, setVisible] = useState(true)
  const s = kindStyles[kind]

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  if (!visible) return null

  return (
    <div
      style={{
        background: s.background,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: '7px',
        padding: '12px 16px',
        fontSize: '13px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        minWidth: '240px',
        maxWidth: '380px',
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => { setVisible(false); onClose?.() }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          fontSize: '16px',
          lineHeight: 1,
          padding: 0,
          opacity: 0.7,
        }}
      >
        ✕
      </button>
    </div>
  )
}

// Toast container – rendered at root
interface Toast {
  id: number
  message: string
  kind: NotificationKind
}

let toastListeners: Array<(t: Toast) => void> = []
let toastId = 0

export function showToast(message: string, kind: NotificationKind = 'info') {
  const t: Toast = { id: ++toastId, message, kind }
  toastListeners.forEach((fn) => fn(t))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (t: Toast) => setToasts((prev) => [...prev, t])
    toastListeners.push(handler)
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== handler)
    }
  }, [])

  const remove = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <div
      style={{
        position: 'fixed',
        top: '72px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 2000,
      }}
    >
      {toasts.map((t) => (
        <Notification key={t.id} message={t.message} kind={t.kind} onClose={() => remove(t.id)} />
      ))}
    </div>
  )
}
