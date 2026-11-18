import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string | null
  options: { value: string; label: string }[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, id, style, ...rest }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '_')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label htmlFor={inputId} style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
          {label}
        </label>
      )}
      <select
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
          cursor: 'pointer',
          ...style,
        }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span style={{ fontSize: '12px', color: '#DC2626' }}>{error}</span>}
    </div>
  )
}
