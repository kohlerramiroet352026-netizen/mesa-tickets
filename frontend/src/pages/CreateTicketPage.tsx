import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTicket } from '../api/tickets'
import type { TicketCategory, TicketPriority } from '../types'
import { Input } from '../components/common/Input'
import { Textarea } from '../components/common/Textarea'
import { Select } from '../components/common/Select'
import { Button } from '../components/common/Button'
import { showToast } from '../components/common/Notification'
import { validateRequired, validateMaxLength } from '../utils/validators'
import { extractErrorMessage } from '../utils/format'

const CATEGORY_OPTIONS: { value: TicketCategory; label: string }[] = [
  { value: 'Consulta', label: 'Consulta' },
  { value: 'Problema técnico', label: 'Problema técnico' },
  { value: 'Acceso', label: 'Acceso' },
  { value: 'Otro', label: 'Otro' },
]

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: 'Baja', label: 'Baja' },
  { value: 'Media', label: 'Media' },
  { value: 'Alta', label: 'Alta' },
  { value: 'Urgente', label: 'Urgente' },
]

export function CreateTicketPage() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<TicketCategory>('Consulta')
  const [priority, setPriority] = useState<TicketPriority>('Media')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    const te = validateRequired(title, 'Título') ?? validateMaxLength(title, 200, 'Título')
    if (te) e.title = te
    const de = validateRequired(description, 'Descripción')
    if (de) e.description = de
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const ticket = await createTicket({ title, description, category, priority })
      showToast('Ticket creado exitosamente', 'success')
      navigate(`/tickets/${ticket.id}`)
    } catch (err) {
      showToast(extractErrorMessage(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div
        style={{
          background: '#fff',
          border: '1px solid #E2E0DC',
          borderRadius: '8px',
          padding: '28px 32px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <h2 style={{ margin: '0 0 24px', fontSize: '17px', fontWeight: 600, color: '#1A1A1A' }}>
          Nuevo ticket
        </h2>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={errors.title}
            maxLength={200}
            placeholder="Resumen del problema o solicitud"
            autoFocus
          />

          <Textarea
            label="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={errors.description}
            rows={5}
            placeholder="Describí el problema con todo el detalle posible..."
          />

          <Select
            label="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            options={CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <Select
            label="Prioridad"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            options={PRIORITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <Button type="submit" variant="primary" loading={submitting}>
              Crear ticket
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(-1)} disabled={submitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
