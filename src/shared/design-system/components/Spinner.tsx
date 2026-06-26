// ─── Types ─────────────────────────────────────────────────────

export type SpinnerSize = 'sm' | 'md' | 'lg'

export interface SpinnerProps {
  size?:      SpinnerSize
  /** Accessible label announced to screen readers. Defaults to 'Cargando…' */
  label?:     string
  className?: string
}

// ─── Constants ─────────────────────────────────────────────────

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
}

// ─── Component ─────────────────────────────────────────────────

export function Spinner({
  size      = 'md',
  label     = 'Cargando…',
  className = '',
}: SpinnerProps) {
  return (
    <svg
      role="status"
      aria-label={label}
      className={`animate-spin shrink-0 ${sizeClasses[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
