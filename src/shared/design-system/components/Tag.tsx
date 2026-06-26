import { type ReactNode } from 'react'

// Tag — etiqueta interactiva con opción de eliminar
// Diferencia con Badge: el Tag es interactivo (clickable, removable)
// Badge es puramente informativo/visual.

export interface TagProps {
  children:   ReactNode
  onRemove?:  () => void
  onClick?:   () => void
  color?:     'gray' | 'navy' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const colorClasses: Record<string, string> = {
  gray:    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  navy:    'bg-navy/10 text-navy dark:bg-navy/20 dark:text-blue-300',
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  danger:  'bg-danger-light  text-danger-dark',
  info:    'bg-info-light    text-info-dark',
}

export function Tag({ children, onRemove, onClick, color = 'gray', className = '' }: TagProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2.5 py-1 rounded text-label font-medium',
        colorClasses[color],
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : '',
        className,
      ].join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          aria-label="Eliminar"
          className="ml-0.5 -mr-0.5 rounded hover:opacity-70 transition-opacity focus:outline-none focus:ring-1 focus:ring-current"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  )
}
