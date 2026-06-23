// PanelCard — tarjeta base del dashboard con tag, hero metric y contenido expandible

import { Card } from '@shared/design-system/components'

export type TagColor = 'warning' | 'success' | 'info' | 'danger' | 'purple' | 'amber'

export function PanelCard({
  featured = false, expanded, onClick,
  tag, title, subtitle,
  animDelay, heroSlot, children,
}: {
  id?:        string
  featured?:  boolean
  expanded:   boolean
  onClick:    () => void
  tag:        string
  tagColor:   TagColor
  title:      string
  subtitle:   string
  animDelay:  number
  heroSlot?:  React.ReactNode
  children:   React.ReactNode
}) {
  return (
    <Card
      variant="flat"
      padding="none"
      onClick={onClick}
      className={[
        'relative overflow-hidden rounded-xl p-4 cursor-pointer',
        'transition-all duration-200 animate-fade-in',
        'bg-white dark:bg-warm-800',
        'border border-warm-200 dark:border-warm-600/30',
        expanded
          ? 'shadow-sm ring-1 ring-gold/40 dark:ring-gold/30'
          : 'shadow-sm hover:shadow-sm',
      ].join(' ')}
      style={{
        animationDelay:    `${animDelay}ms`,
        animationFillMode: 'both',
        borderTop: featured ? '2px solid #C8860A' : undefined,
      }}
    >
      {/* Header row: tag + hero */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <span className="inline-flex mb-1.5 px-2 py-0.5 rounded-full bg-warm-50 dark:bg-warm-800 border border-warm-200 dark:border-warm-600/30 text-warm-500 text-xs font-mono uppercase tracking-widest">
            {tag}
          </span>
          <p className="text-sm font-medium text-lean-black dark:text-warm-50 leading-snug">{title}</p>
          <p className="text-xs text-text-muted dark:text-warm-300 mt-0.5">{subtitle}</p>
        </div>
        {heroSlot}
      </div>

      {children}
    </Card>
  )
}
