import { type ReactNode } from 'react'
import { Button }         from './Button'
import { Badge }          from './Badge'

// ─── Types ─────────────────────────────────────────────────────

export interface ToolHeaderProps {
  /** Called when the back button is clicked */
  onBack?:       () => void
  /** Text label alongside the back chevron. No text = icon-only (with implicit aria-label). */
  backLabel?:    string
  /** Tool code badge (T1–T12). Renders as <Badge variant="navy-ghost"> */
  toolCode?:     string
  /** Main page title — rendered as <h1> */
  title:         string
  /** Company name / context row below the title. String = auto-styled mono. ReactNode = raw. */
  subtitle?:     ReactNode
  /** Slot for <PhaseMiniMap>. Renders inside the title row, after the h1. */
  phaseMiniMap?: ReactNode
  /** Right-side action buttons (primary CTA, export, year selector…) */
  cta?:          ReactNode
  /** Right-side status pills (count badges, alert chips…). Rendered between title block and cta. */
  chips?:        ReactNode
  /** Sticky below the main header (top = var(--header-h, 64px)) with backdrop-blur */
  sticky?:       boolean
  /** Extra row rendered below the main header row (e.g. progress bar in T1, global progress in T12) */
  below?:        ReactNode
  /** Tailwind max-width class for the inner container — default 'max-w-7xl' */
  maxWidth?:     string
  className?:    string
}

// ─── Constants ─────────────────────────────────────────────────

const CHEVRON = (
  <svg
    width="14" height="14" viewBox="0 0 14 14"
    fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 2L4 7l5 5" />
  </svg>
)

// ─── Component ─────────────────────────────────────────────────

export function ToolHeader({
  onBack,
  backLabel,
  toolCode,
  title,
  subtitle,
  phaseMiniMap,
  cta,
  chips,
  sticky    = false,
  below,
  maxWidth  = 'max-w-7xl',
  className = '',
}: ToolHeaderProps) {
  return (
    <header
      className={[
        'bg-[rgba(247,244,238,0.95)] dark:bg-warm-900/95 backdrop-blur-sm',
        'border-b border-border dark:border-white/6',
        'px-8 shrink-0',
        sticky ? 'sticky z-[15]' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={sticky ? { top: 'var(--header-h, 64px)' } : undefined}
    >
      {/* ── Main row ── */}
      <div className={`flex items-center gap-3 h-12 ${maxWidth} mx-auto`}>

        {/* Back button */}
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            icon={CHEVRON}
            aria-label={!backLabel ? 'Volver al dashboard' : undefined}
          >
            {backLabel}
          </Button>
        )}

        {/* Tool identity: badge + h1 + phaseMiniMap + subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {toolCode && (
              <Badge
                variant="navy-ghost"
                size="xs"
                className="rounded-md font-mono uppercase tracking-wider shrink-0"
              >
                {toolCode}
              </Badge>
            )}
            <h1 className="text-xl font-semibold text-lean-black dark:text-warm-50 truncate">
              {title}
            </h1>
            {phaseMiniMap}
          </div>

          {subtitle != null && (
            <div
              className={
                typeof subtitle === 'string'
                  ? 'mt-0.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle'
                  : 'mt-0.5'
              }
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Status chips (alert/count pills) */}
        {chips != null && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {chips}
          </div>
        )}

        {/* Primary CTA / actions */}
        {cta != null && (
          <div className="flex items-center gap-2 shrink-0">
            {cta}
          </div>
        )}
      </div>

      {/* ── Below row (progress bar, etc.) ── */}
      {below != null && (
        <div className={`${maxWidth} mx-auto mt-2.5`}>
          {below}
        </div>
      )}
    </header>
  )
}
