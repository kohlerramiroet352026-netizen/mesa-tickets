import { useEffect, useState } from 'react'
import { getUsers, createUser, updateUser } from '../api/users'
import type { User, UserRole, CreateUserPayload, UpdateUserPayload } from '../types'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Select } from '../components/common/Select'
import { Spinner } from '../components/common/Spinner'
import { EmptyState } from '../components/common/EmptyState'
import { showToast } from '../components/common/Notification'
import { formatDateShort, roleLabel, extractErrorMessage } from '../utils/format'
import { validateRequired, validateEmail, validatePassword } from '../utils/validators'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'user', label: 'Usuario' },
  { value: 'agent', label: 'Agente' },
  { value: 'admin', label: 'Admin' },
]

interface UserFormData {
  name: string
  email: string
  password: string
  role: UserRole
  active: boolean
}

const emptyForm = (): UserFormData => ({ name: '', email: '', password: '', role: 'user', active: true })

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserFormData>(emptyForm())
  const [formErrors, setFormErrors] = useState<Partial<UserFormData>>({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getUsers()
      setUsers(data)
    } catch {
      setError('No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingUser(null)
    setForm(emptyForm())
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (u: User) => {
    setEditingUser(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role, active: u.active })
    setFormErrors({})
    setModalOpen(true)
  }

  const validate = (isEdit: boolean): boolean => {
    const e: Partial<UserFormData> = {}
    const ne = validateRequired(form.name, 'Nombre')
    if (ne) e.name = ne
    const ee = validateRequired(form.email, 'Email') ?? validateEmail(form.email)
    if (ee) e.email = ee
    if (!isEdit || form.password) {
      const pe = validatePassword(form.password)
      if (pe) e.password = pe
    }
    setFormErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    const isEdit = !!editingUser
    if (!validate(isEdit)) return
    setSaving(true)
    try {
      if (isEdit && editingUser) {
        const payload: UpdateUserPayload = {
          name: form.name,
          email: form.email,
          role: form.role,
          active: form.active,
        }
        if (form.password) payload.password = form.password
        const updated = await updateUser(editingUser.id, payload)
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
        showToast('Usuario actualizado', 'success')
      } else {
        const payload: CreateUserPayload = {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          active: form.active,
        }
        const created = await createUser(payload)
        setUsers((prev) => [...prev, created])
        showToast('Usuario creado', 'success')
      }
      setModalOpen(false)
    } catch (err) {
      showToast(extractErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (u: User) => {
    try {
      const updated = await updateUser(u.id, { active: !u.active })
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
      showToast(updated.active ? 'Usuario activado' : 'Usuario desactivado', 'success')
    } catch (err) {
      showToast(extractErrorMessage(err), 'error')
    }
  }

  return (
    <>
      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '8px',
              padding: '28px 32px',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600 }}>
              {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Input
                label="Nombre"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                error={formErrors.name}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                error={formErrors.email}
              />
              <Input
                label={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                error={formErrors.password}
                placeholder={editingUser ? 'Dejar vacío para no cambiar' : ''}
              />
              <Select
                label="Rol"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                options={ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
                Usuario activo
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>
                {editingUser ? 'Guardar cambios' : 'Crear usuario'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={openCreate}>
            + Nuevo usuario
          </Button>
        </div>

        <div
          style={{
            background: '#fff',
            border: '1px solid #E2E0DC',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
              <Spinner size={28} />
            </div>
          ) : error ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#DC2626', fontSize: '14px' }}>{error}</div>
          ) : users.length === 0 ? (
            <EmptyState message="No hay usuarios registrados" />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F9F9F8', borderBottom: '1px solid #E2E0DC' }}>
                    {['Nombre', 'Email', 'Rol', 'Estado', 'Creado', 'Acciones'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 14px',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: '#6B7280',
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.03em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr
                      key={u.id}
                      style={{ borderBottom: i < users.length - 1 ? '1px solid #F5F4F2' : 'none' }}
                    >
                      <td style={{ padding: '11px 14px', fontWeight: 500, color: '#1A1A1A' }}>{u.name}</td>
                      <td style={{ padding: '11px 14px', color: '#6B7280' }}>{u.email}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <Badge value={roleLabel(u.role)} variant="role" />
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <Badge
                          value={u.active ? 'Activo' : 'Inactivo'}
                          variant="active"
                        />
                      </td>
                      <td
                        style={{
                          padding: '11px 14px',
                          color: '#6B7280',
                          fontFamily: "ui-monospace, 'SF Mono', Consolas, monospace",
                          fontSize: '12px',
                        }}
                      >
                        {formatDateShort(u.created_at)}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                            Editar
                          </Button>
                          <Button
                            variant={u.active ? 'danger' : 'secondary'}
                            size="sm"
                            onClick={() => toggleActive(u)}
                          >
                            {u.active ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
