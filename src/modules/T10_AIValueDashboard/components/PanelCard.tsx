import React from 'react'
// PanelCard — tarjeta base del dashboard con tag, hero metric y contenido expandible

import { Card } from '@shared/design-system/components'

export function PanelCard({
  featured = false, expanded, onClick,
  tag, title, subtitle,
  animDelay, heroSlot, children, locked = false,
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
  locked?:    boolean
}) {
  return (
    <div className="relative">
      {locked && (
        <div className="absolute inset-0 z-10 rounded-xl bg-white/60 dark:bg-warm-900/60 backdrop-blur-[1px] flex items-start justify-end p-2 pointer-events-none">
          <span className="text-[9px] font-mono uppercase tracking-wider text-black/40 dark:text-white/35 border border-black/12 dark:border-white/12 rounded px-1.5 py-0.5 bg-white/80 dark:bg-warm-900/80">
            No incluido en plan
          </span>
        </div>
      )}
    <Card
      variant={featured ? 'featured' : 'outlined'}
      padding="none"
      onClick={locked ? undefined : onClick}
      className={[
        'relative overflow-hidden p-4',
        locked ? 'cursor-default opacity-45 select-none' : 'cursor-pointer',
        'transition-all duration-200 animate-fade-in',
        expanded && !locked ? 'ring-1 ring-gold/40 dark:ring-gold/30' : '',
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
    </div>
  )
}
