export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        border: '2px solid #E2E0DC',
        borderTopColor: '#2C5F6E',
        borderRadius: '50%',
        display: 'inline-block',
        animation: 'spin 0.6s linear infinite',
      }}
    />
  )
}
