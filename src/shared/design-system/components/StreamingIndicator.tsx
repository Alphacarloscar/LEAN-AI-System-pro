// ─── Types ─────────────────────────────────────────────────────

export interface StreamingIndicatorProps {
  label?:   string
  variant?: 'inline' | 'card'
}

// ─── Constants ──────────────────────────────────────────────────

const shimmerBar = [
  'bg-gradient-to-r from-gray-100 via-amber-100 to-gray-100',
  'bg-[length:200%_100%]',
  'animate-shimmer',
  'dark:from-warm-700 dark:via-amber-900/30 dark:to-warm-700',
  'rounded-full',
].join(' ')

// ─── Component ─────────────────────────────────────────────────

export function StreamingIndicator({
  label   = 'Generando con IA…',
  variant = 'inline',
}: StreamingIndicatorProps) {
  if (variant === 'card') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className="flex flex-col items-center justify-center gap-3 w-full h-full min-h-[80px] px-4 py-5"
      >
        <div className={`${shimmerBar} w-full h-1.5`} />
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <SpinnerSm />
          <span className="text-xs font-medium text-text-muted">{label}</span>
        </div>
        <div className={`${shimmerBar} w-3/4 h-1`} />
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="flex items-center gap-2 h-6"
    >
      <div className={`${shimmerBar} w-24 h-1.5`} />
      <SpinnerSm />
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  )
}

// Minimal inline spinner — avoids importing from barrel to prevent circular refs
function SpinnerSm() {
  return (
    <svg
      aria-hidden="true"
      className="animate-spin h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
