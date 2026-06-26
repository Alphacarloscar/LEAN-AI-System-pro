// ─── Types ─────────────────────────────────────────────────────

export interface StreamingIndicatorProps {
  label?:   string
  variant?: 'inline' | 'card' | 'card-full'
}

// ─── Constants ──────────────────────────────────────────────────

const shimmerBar = [
  'bg-gradient-to-r from-gray-100 via-amber-100 to-gray-100',
  'bg-[length:200%_100%]',
  'animate-shimmer',
  'dark:from-warm-700 dark:via-amber-900/30 dark:to-warm-700',
  'rounded-full',
].join(' ')

// ─── Subcomponents ──────────────────────────────────────────────

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

function SparklesIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0 text-[#C8860A]"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.5 3.5l2 2M10.5 10.5l2 2M10.5 3.5l-2 2M5.5 10.5l-2 2" />
    </svg>
  )
}

// ─── Component ─────────────────────────────────────────────────

export function StreamingIndicator({
  label   = 'Generando con IA…',
  variant = 'inline',
}: StreamingIndicatorProps) {

  // ── card-full: ocupa toda la tarjeta, badge gold parpadeante ──
  if (variant === 'card-full') {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={label}
        className="flex flex-col items-center justify-center gap-4 w-full min-h-[140px] px-6 py-8 rounded-xl border border-border dark:border-white/8 bg-gradient-to-b from-amber-50/60 to-transparent dark:from-amber-900/10 dark:to-transparent"
      >
        {/* Shimmer bars */}
        <div className="w-full space-y-2.5">
          <div className={`${shimmerBar} w-full h-2`} />
          <div className={`${shimmerBar} w-4/5 h-1.5`} />
          <div className={`${shimmerBar} w-2/3 h-1.5`} />
        </div>

        {/* Pulsing gold badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-300/60 dark:border-amber-700/50 bg-white/80 dark:bg-warm-800/60 animate-pulse">
          <SparklesIcon />
          <span className="text-[11px] font-semibold text-[#C8860A] dark:text-amber-400 whitespace-nowrap">
            {label}
          </span>
        </div>
      </div>
    )
  }

  // ── card: vertical layout, sin badge full-width ───────────────
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

  // ── inline: horizontal, single line ──────────────────────────
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
