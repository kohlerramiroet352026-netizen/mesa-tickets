import { Button } from './Button'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        justifyContent: 'flex-end',
        padding: '12px 0',
      }}
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        &#8249; Anterior
      </Button>
      <span style={{ fontSize: '13px', color: '#6B7280' }}>
        {page} / {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente &#8250;
      </Button>
    </div>
  )
}
