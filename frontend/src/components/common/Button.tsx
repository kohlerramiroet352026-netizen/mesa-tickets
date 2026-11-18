import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: 500,
    border: '1px solid transparent',
    borderRadius: '6px',
    cursor: loading || disabled ? 'not-allowed' : 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
    fontSize: size === 'sm' ? '13px' : size === 'lg' ? '16px' : '14px',
    padding: size === 'sm' ? '4px 10px' : size === 'lg' ? '10px 20px' : '7px 14px',
    opacity: loading || disabled ? 0.65 : 1,
  }

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: '#2C5F6E', color: '#fff', borderColor: '#2C5F6E' },
    secondary: { background: '#fff', color: '#1A1A1A', borderColor: '#E2E0DC' },
    danger: { background: '#DC2626', color: '#fff', borderColor: '#DC2626' },
    ghost: { background: 'transparent', color: '#2C5F6E', borderColor: 'transparent' },
  }

  return (
    <button
      disabled={loading || disabled}
      style={{ ...base, ...variants[variant], ...style }}
      {...rest}
    >
      {loading && (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  )
}
