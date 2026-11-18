export function validateRequired(value: string, label: string): string | null {
  if (!value || !value.trim()) return `${label} es requerido`
  return null
}

export function validateMaxLength(value: string, max: number, label: string): string | null {
  if (value.length > max) return `${label} no puede superar ${max} caracteres`
  return null
}

export function validateEmail(email: string): string | null {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email)) return 'Email inválido'
  return null
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
  return null
}
