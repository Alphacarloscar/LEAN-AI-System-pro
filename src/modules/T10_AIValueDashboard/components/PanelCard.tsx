// PanelCard — tarjeta base del dashboard con tag, hero metric y contenido expandible

import { Card } from '@shared/design-system/components'

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
  title:      string
  subtitle:   string
  animDelay:  number
  heroSlot?:  React.ReactNode
  children:   React.ReactNode
}) {
  return (
    <Card
      variant={featured ? 'featured' : 'outlined'}
      padding="none"
      onClick={onClick}
      className={[
        'relative overflow-hidden p-4 cursor-pointer',
        'transition-all duration-200 animate-fade-in',
        expanded ? 'ring-1 ring-gold/40 dark:ring-gold/30' : '',
      ].join(' ')}
      style={{
        animationDelay:    `${animDelay}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <span className="inline-flex mb-1.5 px-2 py-0.5 rounded-full bg-surface dark:bg-warm-900 border border-warm-200 dark:border-warm-600/30 text-warm-500 dark:text-warm-300 text-[10px] font-sans uppercase tracking-widest">
            {tag}
          </span>
          <p className="text-base font-semibold text-lean-black dark:text-warm-50 leading-snug">{title}</p>
          <p className="text-xs text-text-muted dark:text-warm-300 mt-0.5">{subtitle}</p>
        </div>
        {heroSlot}
      </div>

      {children}
    </Card>
  )
}
