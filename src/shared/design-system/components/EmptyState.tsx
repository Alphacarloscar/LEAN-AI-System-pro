import { type ReactNode } from 'react'

// ─── Types ─────────────────────────────────────────────────────

export interface EmptyStateProps {
  /** SVG or any ReactNode rendered inside the icon well */
  icon?:        ReactNode
  title:        string
  description?: string
  /** CTA button or link rendered below the description */
  action?:      ReactNode
  className?:   string
}

// ─── Component ─────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center gap-4 py-16 px-6 text-center',
        className,
      ].join(' ')}
    >
      {icon && (
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 text-gold shrink-0">
          {icon}
        </div>
      )}

      <div className="space-y-1.5 max-w-xs">
        <p className="text-sm font-semibold text-lean-black dark:text-warm-50">
          {title}
        </p>
        {description && (
          <p className="text-xs text-text-muted dark:text-warm-300 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="mt-1">
          {action}
        </div>
      )}
    </div>
  )
}
