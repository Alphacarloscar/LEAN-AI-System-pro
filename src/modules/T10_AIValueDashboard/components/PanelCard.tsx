// PanelCard — tarjeta base del dashboard con tag, hero metric y contenido expandible

import { Badge, Card, type BadgeVariant } from '@shared/design-system/components'

export type TagColor = 'warning' | 'success' | 'info' | 'danger' | 'purple' | 'amber'

// Variant semántico para colores que coinciden 1:1 con DS BadgeVariant
const TAG_VARIANT: Partial<Record<TagColor, BadgeVariant>> = {
  warning: 'warning',
  success: 'success',
  info:    'info',
  danger:  'danger',
  amber:   'warning',
}

// Inline style para el único caso sin DS variant (purple)
const TAG_INLINE_STYLE: Partial<Record<TagColor, { backgroundColor: string; color: string }>> = {
  purple: { backgroundColor: '#EEEDFE', color: '#3C3489' },
}

export function PanelCard({
  featured = false, expanded, onClick,
  tag, tagColor, title, subtitle,
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
  const tagVariant = TAG_VARIANT[tagColor]
  const tagStyle   = TAG_INLINE_STYLE[tagColor]

  return (
    <Card
      variant="flat"
      padding="none"
      onClick={onClick}
      className={[
        'relative overflow-hidden rounded-xl p-4 cursor-pointer',
        'transition-all duration-200 animate-fade-in',
        'bg-white dark:bg-warm-600',
        expanded
          ? 'shadow-lg ring-1 ring-gold/40 dark:ring-gold/30'
          : 'shadow-border dark:shadow-border-dark hover:shadow-md',
      ].join(' ')}
      style={{
        animationDelay:    `${animDelay}ms`,
        animationFillMode: 'both',
        borderTop: featured ? '2px solid #C8860A' : undefined,
      }}
    >
      {featured && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ background: 'linear-gradient(135deg, #C8860A 0%, transparent 60%)' }} />
      )}

      {/* Header row: tag + hero */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <Badge
            variant={tagVariant ?? 'default'}
            shape="pill"
            size="xs"
            style={tagStyle}
            className="mb-1.5"
          >
            {tag}
          </Badge>
          <p className="text-sm font-medium text-lean-black dark:text-warm-50 leading-snug">{title}</p>
          <p className="text-[11px] text-text-muted dark:text-warm-300 mt-0.5">{subtitle}</p>
        </div>
        {heroSlot}
      </div>

      {children}
    </Card>
  )
}
