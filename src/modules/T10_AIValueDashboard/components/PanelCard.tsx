// PanelCard — tarjeta base del dashboard con tag, hero metric y contenido expandible

export type TagColor = 'warning' | 'success' | 'info' | 'danger' | 'purple' | 'amber'

const TAG_CLASSES: Record<TagColor, string> = {
  warning: 'bg-warning-light text-warning-dark',
  success: 'bg-success-light text-success-dark',
  info:    'bg-info-light text-info-dark',
  danger:  'bg-danger-light text-danger-dark',
  purple:  'bg-[#EEEDFE] text-[#3C3489]',
  amber:   'bg-warning-light text-warning-dark',
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
  return (
    <div
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
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full inline-block mb-1.5 ${TAG_CLASSES[tagColor]}`}>
            {tag}
          </span>
          <p className="text-sm font-medium text-lean-black dark:text-warm-50 leading-snug">{title}</p>
          <p className="text-[11px] text-text-muted dark:text-warm-300 mt-0.5">{subtitle}</p>
        </div>
        {heroSlot}
      </div>

      {children}
    </div>
  )
}
