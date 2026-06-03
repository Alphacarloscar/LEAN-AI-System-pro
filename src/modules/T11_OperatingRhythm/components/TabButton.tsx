// TabButton — botón de pestaña, mismo estilo que T8

export function TabButton({ active, label, badge, onClick }: {
  active:   boolean
  label:    string
  badge?:   string
  onClick:  () => void
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5',
        active
          ? 'border-navy/50 bg-navy/8 dark:bg-navy/15 text-navy dark:text-warm-100 shadow-sm'
          : 'border-border dark:border-white/10 text-text-muted hover:border-navy/30 hover:text-navy/70',
      ].join(' ')}
    >
      {label}
      {badge && (
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-navy/15 dark:bg-navy/30 text-navy dark:text-warm-100">
          {badge}
        </span>
      )}
    </button>
  )
}
