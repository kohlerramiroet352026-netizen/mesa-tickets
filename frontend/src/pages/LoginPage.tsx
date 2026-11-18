import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Input } from '../components/common/Input'
import { Button } from '../components/common/Button'
import { extractErrorMessage } from '../utils/format'
import { validateRequired, validateEmail } from '../utils/validators'

export function LoginPage() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  const validate = () => {
    const e: { email?: string; password?: string } = {}
    e.email = validateRequired(email, 'Email') ?? validateEmail(email) ?? undefined
    e.password = validateRequired(password, 'Contraseña') ?? undefined
    setErrors(e)
    return !e.email && !e.password
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    setApiError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setApiError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F4F2',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '10px',
          padding: '40px 36px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
          border: '1px solid #E2E0DC',
        }}
      >
        <h1
          style={{
            margin: '0 0 6px',
            fontSize: '24px',
            fontWeight: 700,
            color: '#2C5F6E',
            textAlign: 'center',
          }}
        >
          Mesa
        </h1>
        <p style={{ margin: '0 0 28px', textAlign: 'center', color: '#6B7280', fontSize: '14px' }}>
          Sistema de gestión de tickets
        </p>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
            autoFocus
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
          />

          {apiError && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '13px',
                color: '#DC2626',
              }}
            >
              {apiError}
            </div>
          )}

          <Button type="submit" variant="primary" loading={submitting} style={{ width: '100%', justifyContent: 'center' }}>
            Iniciar sesión
          </Button>
        </form>
      </div>
    </div>
  )
}
