import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string | null
}

export function Input({ label, error, id, style, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '_')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        style={{
          padding: '8px 10px',
          border: `1px solid ${error ? '#DC2626' : '#E2E0DC'}`,
          borderRadius: '6px',
          fontSize: '14px',
          color: '#1A1A1A',
          background: '#fff',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          ...style,
        }}
        {...rest}
      />
      {error && <span style={{ fontSize: '12px', color: '#DC2626' }}>{error}</span>}
    </div>
  )
}
