// ============================================================
// SegmentedControl — exclusive N-option selection group
//
// A11y: role=radiogroup, roving tabindex, Arrow-key navigation.
// Domain colors pass through activeColor — not baked in here.
// ============================================================

import { useCallback, useRef, type ReactNode, type KeyboardEvent } from 'react'

// ── Types ─────────────────────────────────────────────────────

export interface SegmentedControlOption {
  value:        string
  label:        string
  /**
   * CSS color string (hex, rgba…) applied as backgroundColor when active.
   * Text color is auto-derived for contrast (white on dark, near-black on light).
   * Omit to use the default primary (navy metallic) active style.
   */
  activeColor?: string
  icon?:        ReactNode
}

export interface SegmentedControlProps {
  options:      SegmentedControlOption[]
  value:        string
  onChange:     (value: string) => void
  size?:        'sm' | 'md'
  /**
   * Max options per row — renders as CSS grid.
   * Omit (or leave undefined) for a single-row flex layout.
   */
  columns?:     number
  /** Required: describes the selection group for assistive tech. */
  'aria-label': string
}

// ── Contrast helper ───────────────────────────────────────────
// Returns white for dark backgrounds, near-black for light ones.

function contrastColor(bg: string): string {
  if (!bg.startsWith('#')) return '#1C1A16'  // non-hex (rgba, etc.) → dark text
  const h = bg.slice(1)
  const r = parseInt(h.length === 3 ? h[0] + h[0] : h.slice(0, 2), 16)
  const g = parseInt(h.length === 3 ? h[1] + h[1] : h.slice(2, 4), 16)
  const b = parseInt(h.length === 3 ? h[2] + h[2] : h.slice(4, 6), 16)
  const lum = (r * 299 + g * 587 + b * 114) / 255000
  return lum < 0.5 ? '#FFFFFF' : '#1C1A16'
}

// ── Size classes ──────────────────────────────────────────────

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'px-2 py-1.5 text-xs font-semibold gap-1',
  md: 'px-3 py-2   text-sm font-medium  gap-1.5',
}

// ── Component ─────────────────────────────────────────────────

export function SegmentedControl({
  options,
  value,
  onChange,
  size = 'sm',
  columns,
  'aria-label': ariaLabel,
}: SegmentedControlProps) {
  const groupRef    = useRef<HTMLDivElement>(null)
  const currentIdx  = options.findIndex((o) => o.value === value)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // Space/Enter on focused (selected) option — no-op but prevent form submit
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        return
      }
      const isNext = e.key === 'ArrowRight' || e.key === 'ArrowDown'
      const isPrev = e.key === 'ArrowLeft'  || e.key === 'ArrowUp'
      if (!isNext && !isPrev) return
      e.preventDefault()

      const nextIdx = isNext
        ? (currentIdx + 1) % options.length
        : (currentIdx - 1 + options.length) % options.length

      onChange(options[nextIdx].value)

      // Focus the newly selected option after React re-renders
      requestAnimationFrame(() => {
        groupRef.current
          ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[nextIdx]?.focus()
      })
    },
    [currentIdx, options, onChange],
  )

  const containerClass = columns ? 'grid gap-2' : 'flex gap-2'
  const containerStyle = columns
    ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
    : undefined

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={containerClass}
      style={containerStyle}
      onKeyDown={handleKeyDown}
    >
      {options.map((opt) => {
        const isActive     = opt.value === value
        const hasColor     = isActive && Boolean(opt.activeColor)
        const activeStyle  = hasColor
          ? {
              backgroundColor: opt.activeColor,
              color:           contrastColor(opt.activeColor!),
              borderColor:     'transparent',
            } satisfies React.CSSProperties
          : undefined

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(opt.value)}
            style={activeStyle}
            className={[
              'flex items-center justify-center rounded-lg border',
              'transition-all duration-150 select-none outline-none',
              sizeClasses[size],
              // Default active (no activeColor) — uses primary token
              isActive && !opt.activeColor
                ? 'bg-navy-metallic dark:bg-gold-metallic text-white dark:text-lean-black border-transparent shadow-sm'
                : '',
              // Inactive
              !isActive
                ? [
                    'bg-white dark:bg-warm-800',
                    'text-text-muted dark:text-warm-300',
                    'border-border dark:border-warm-600/30',
                    'hover:border-warm-400 dark:hover:border-warm-400',
                  ].join(' ')
                : '',
              'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1',
            ].filter(Boolean).join(' ')}
          >
            {opt.icon && (
              <span className="shrink-0" aria-hidden="true">{opt.icon}</span>
            )}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

SegmentedControl.displayName = 'SegmentedControl'
