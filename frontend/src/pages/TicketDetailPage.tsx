import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getTicket,
  updateTicket,
  assignTicket,
  getTicketComments,
  addComment,
  getTicketEvents,
} from '../api/tickets'
import { getUsers } from '../api/users'
import type { Ticket, Comment, TicketEvent, User, TicketStatus, TicketPriority, CommentVisibility } from '../types'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Select } from '../components/common/Select'
import { Textarea } from '../components/common/Textarea'
import { Input } from '../components/common/Input'
import { Spinner } from '../components/common/Spinner'
import { Modal } from '../components/common/Modal'
import { showToast } from '../components/common/Notification'
import { useAuth } from '../hooks/useAuth'
import { formatDate, timeAgo, extractErrorMessage } from '../utils/format'
import { validateRequired } from '../utils/validators'

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'Abierto', label: 'Abierto' },
  { value: 'En progreso', label: 'En progreso' },
  { value: 'En espera', label: 'En espera' },
  { value: 'Resuelto', label: 'Resuelto' },
]
const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'Baja', label: 'Baja' },
  { value: 'Media', label: 'Media' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Urgente', label: 'Urgente' },
]

function eventDescription(e: TicketEvent): string {
  switch (e.event_type) {
    case 'status_change':
      return `cambió el estado de "${e.old_value}" a "${e.new_value}"`
    case 'priority_change':
      return `cambió la prioridad de "${e.old_value}" a "${e.new_value}"`
    case 'assigned':
      return e.new_value ? `asignó el ticket a ${e.new_value}` : 'desasignó el ticket'
    case 'created':
      return 'creó el ticket'
    case 'comment_added':
      return 'agregó un comentario'
    default:
      return e.event_type.replace(/_/g, ' ')
  }
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [events, setEvents] = useState<TicketEvent[]>([])
  const [agents, setAgents] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit mode for user
  const [editMode, setEditMode] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Agent actions
  const [newStatus, setNewStatus] = useState<TicketStatus>('Abierto')
  const [newPriority, setNewPriority] = useState<TicketPriority>('Media')
  const [assignTo, setAssignTo] = useState<string>('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingPriority, setUpdatingPriority] = useState(false)
  const [assigning, setAssigning] = useState(false)

  // Comment
  const [commentContent, setCommentContent] = useState('')
  const [commentVisibility, setCommentVisibility] = useState<CommentVisibility>('public')
  const [commentError, setCommentError] = useState<string | null>(null)
  const [submittingComment, setSubmittingComment] = useState(false)

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    message: string
    action: () => Promise<void>
  }>({ open: false, title: '', message: '', action: async () => {} })
  const [confirmLoading, setConfirmLoading] = useState(false)

  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'admin'

  const loadAll = async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [t, c, ev] = await Promise.all([
        getTicket(Number(id)),
        getTicketComments(Number(id)),
        getTicketEvents(Number(id)).catch(() => []),
      ])
      setTicket(t)
      setComments(c)
      setEvents(ev)
      setNewStatus(t.status)
      setNewPriority(t.priority)
      setAssignTo(t.assigned_to ? String(t.assigned_to) : '')
      setEditTitle(t.title)
      setEditDescription(t.description)
      setEditCategory(t.category)
    } catch {
      setError('No se pudo cargar el ticket')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    if (isAgentOrAdmin) {
      getUsers()
        .then((u) => setAgents(u.filter((x) => x.role !== 'user' && x.active)))
        .catch(() => {})
    }
  }, [id])

  const handleSaveEdit = async () => {
    const errs: Record<string, string> = {}
    const te = validateRequired(editTitle, 'Título')
    if (te) errs.title = te
    const de = validateRequired(editDescription, 'Descripción')
    if (de) errs.description = de
    if (Object.keys(errs).length) { setEditErrors(errs); return }
    setSaving(true)
    try {
      const updated = await updateTicket(Number(id), {
        title: editTitle,
        description: editDescription,
        category: editCategory as Ticket['category'],
      })
      setTicket(updated)
      setEditMode(false)
      showToast('Ticket actualizado', 'success')
    } catch (err) {
      showToast(extractErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = () => {
    if (newStatus === ticket?.status) return
    const isResolving = newStatus === 'Resuelto'
    if (isResolving) {
      setConfirmModal({
        open: true,
        title: 'Marcar como resuelto',
        message: '¿Estás seguro de que querés marcar este ticket como Resuelto?',
        action: async () => {
          const updated = await updateTicket(Number(id), { status: newStatus })
          setTicket(updated)
          setNewStatus(updated.status)
          showToast('Estado actualizado', 'success')
          await loadAll()
        },
      })
    } else {
      doStatusChange()
    }
  }

  const doStatusChange = async () => {
    setUpdatingStatus(true)
    try {
      const updated = await updateTicket(Number(id), { status: newStatus })
      setTicket(updated)
      showToast('Estado actualizado', 'success')
      await loadAll()
    } catch (err) {
      showToast(extractErrorMessage(err), 'error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handlePriorityChange = async () => {
    if (newPriority === ticket?.priority) return
    setUpdatingPriority(true)
    try {
      const updated = await updateTicket(Number(id), { priority: newPriority })
      setTicket(updated)
      showToast('Prioridad actualizada', 'success')
    } catch (err) {
      showToast(extractErrorMessage(err), 'error')
    } finally {
      setUpdatingPriority(false)
    }
  }

  const handleAssign = async () => {
    if (!assignTo) return
    setAssigning(true)
    try {
      const updated = await assignTicket(Number(id), Number(assignTo))
      setTicket(updated)
      showToast('Ticket asignado', 'success')
      await loadAll()
    } catch (err) {
      showToast(extractErrorMessage(err), 'error')
    } finally {
      setAssigning(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const ce = validateRequired(commentContent, 'Comentario')
    if (ce) { setCommentError(ce); return }
    setCommentError(null)
    setSubmittingComment(true)
    try {
      const c = await addComment(Number(id), { content: commentContent, visibility: commentVisibility })
      setComments((prev) => [...prev, c])
      setCommentContent('')
      showToast('Comentario agregado', 'success')
    } catch (err) {
      showToast(extractErrorMessage(err), 'error')
    } finally {
      setSubmittingComment(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
        <Spinner size={36} />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#DC2626', fontSize: '14px' }}>
        {error ?? 'Ticket no encontrado'}
      </div>
    )
  }

  const canEditAsUser =
    user?.role === 'user' && ticket.created_by === user.id && ticket.status === 'Abierto'

  const visibleComments = comments.filter(
    (c) => c.visibility === 'public' || isAgentOrAdmin
  )

  return (
    <>
      <Modal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="Confirmar"
        onCancel={() => setConfirmModal((m) => ({ ...m, open: false }))}
        onConfirm={async () => {
          setConfirmLoading(true)
          try {
            await confirmModal.action()
          } finally {
            setConfirmLoading(false)
            setConfirmModal((m) => ({ ...m, open: false }))
          }
        }}
        loading={confirmLoading}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '860px' }}>
        {/* Header */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #E2E0DC',
            borderRadius: '8px',
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
            <code
              style={{
                fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace",
                fontSize: '13px',
                color: '#6B7280',
                background: '#F5F4F2',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid #E2E0DC',
                whiteSpace: 'nowrap',
              }}
            >
              {ticket.code}
            </code>
            <div style={{ flex: 1 }}>
              {editMode ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  error={editErrors.title}
                />
              ) : (
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1A1A1A' }}>
                  {ticket.title}
                </h2>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge value={ticket.status} variant="status" />
            <Badge value={ticket.priority} variant="priority" />
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Main content */}
          <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Description */}
            <div
              style={{
                background: '#fff',
                border: '1px solid #E2E0DC',
                borderRadius: '8px',
                padding: '20px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>Descripción</h3>
                {canEditAsUser && !editMode && (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(true)}>
                    Editar
                  </Button>
                )}
              </div>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    error={editErrors.description}
                    rows={5}
                  />
                  <Select
                    label="Categoría"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    options={[
                      { value: 'Consulta', label: 'Consulta' },
                      { value: 'Problema técnico', label: 'Problema técnico' },
                      { value: 'Acceso', label: 'Acceso' },
                      { value: 'Otro', label: 'Otro' },
                    ]}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="primary" onClick={handleSaveEdit} loading={saving} size="sm">
                      Guardar
                    </Button>
                    <Button variant="secondary" onClick={() => setEditMode(false)} size="sm" disabled={saving}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {ticket.description}
                </p>
              )}
            </div>

            {/* Comments */}
            <div
              style={{
                background: '#fff',
                border: '1px solid #E2E0DC',
                borderRadius: '8px',
                padding: '20px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                Comentarios ({visibleComments.length})
              </h3>

              {visibleComments.length === 0 ? (
                <p style={{ color: '#6B7280', fontSize: '13px', margin: '0 0 16px' }}>Sin comentarios aún</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {visibleComments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '6px',
                        border: `1px solid ${c.visibility === 'internal' ? '#FDE68A' : '#E2E0DC'}`,
                        background: c.visibility === 'internal' ? '#FFFBEB' : '#F9F9F8',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '6px',
                          fontSize: '12px',
                          color: '#6B7280',
                        }}
                      >
                        <strong style={{ color: '#374151' }}>{c.author_name ?? `Usuario #${c.author_id}`}</strong>
                        <span>·</span>
                        <span>{timeAgo(c.created_at)}</span>
                        {c.visibility === 'internal' && (
                          <span
                            style={{
                              background: '#FDE68A',
                              color: '#92400E',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: 600,
                              marginLeft: '4px',
                            }}
                          >
                            INTERNO
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment form */}
              <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Textarea
                  placeholder="Escribí tu comentario..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  error={commentError}
                  rows={3}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {isAgentOrAdmin && (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        color: '#374151',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={commentVisibility === 'internal'}
                        onChange={(e) => setCommentVisibility(e.target.checked ? 'internal' : 'public')}
                      />
                      Nota interna
                    </label>
                  )}
                  <Button type="submit" variant="primary" size="sm" loading={submittingComment}>
                    Agregar comentario
                  </Button>
                </div>
              </form>
            </div>

            {/* Event history */}
            {events.length > 0 && (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E2E0DC',
                  borderRadius: '8px',
                  padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                  Historial de actividad
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      style={{ display: 'flex', gap: '10px', alignItems: 'baseline', fontSize: '13px' }}
                    >
                      <code
                        style={{
                          fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace",
                          fontSize: '11px',
                          color: '#9CA3AF',
                          whiteSpace: 'nowrap',
                          minWidth: '110px',
                        }}
                      >
                        {formatDate(ev.created_at)}
                      </code>
                      <span style={{ color: '#374151' }}>
                        <strong>{ev.actor_name ?? `#${ev.actor_id}`}</strong>{' '}
                        {eventDescription(ev)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar info */}
          <div style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Info card */}
            <div
              style={{
                background: '#fff',
                border: '1px solid #E2E0DC',
                borderRadius: '8px',
                padding: '18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                fontSize: '13px',
              }}
            >
              <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 600, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Detalles
              </h3>
              <InfoRow label="Categoría" value={ticket.category} />
              <InfoRow label="Creado por" value={ticket.creator_name ?? ticket.created_by_name ?? `#${ticket.created_by}`} />
              <InfoRow label="Asignado a" value={ticket.assignee_name ?? ticket.assigned_to_name ?? '—'} />
              <InfoRow label="Creado" value={formatDate(ticket.created_at)} />
              <InfoRow label="Actualizado" value={formatDate(ticket.updated_at)} />
              {ticket.resolved_at && (
                <InfoRow label="Resuelto" value={formatDate(ticket.resolved_at)} />
              )}
            </div>

            {/* Agent actions */}
            {isAgentOrAdmin && (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid #E2E0DC',
                  borderRadius: '8px',
                  padding: '18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Acciones
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>Estado</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: '1px solid #E2E0DC',
                        borderRadius: '5px',
                        fontSize: '13px',
                        background: '#fff',
                      }}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <Button variant="primary" size="sm" onClick={handleStatusChange} loading={updatingStatus}>
                      OK
                    </Button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>Prioridad</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: '1px solid #E2E0DC',
                        borderRadius: '5px',
                        fontSize: '13px',
                        background: '#fff',
                      }}
                    >
                      {PRIORITY_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <Button variant="primary" size="sm" onClick={handlePriorityChange} loading={updatingPriority}>
                      OK
                    </Button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#6B7280' }}>Asignar a</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      value={assignTo}
                      onChange={(e) => setAssignTo(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        border: '1px solid #E2E0DC',
                        borderRadius: '5px',
                        fontSize: '13px',
                        background: '#fff',
                      }}
                    >
                      <option value="">Sin asignar</option>
                      {agents.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    <Button variant="primary" size="sm" onClick={handleAssign} loading={assigning} disabled={!assignTo}>
                      OK
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
              ← Volver
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '13px', color: '#374151' }}>{value}</div>
    </div>
  )
}
