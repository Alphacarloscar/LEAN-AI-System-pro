// NavButton — enlace de navegación a herramienta

export function NavButton({ label, onClick, secondary = false }: {
  label:      string
  onClick:    () => void
  secondary?: boolean
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={[
        'flex items-center gap-1 text-[11px] font-medium transition-colors',
        secondary ? 'text-text-muted dark:text-warm-300 hover:text-gold' : 'text-gold-text hover:underline',
      ].join(' ')}
    >
      {label}
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M2 6h8M6.5 2.5L10 6l-3.5 3.5" />
      </svg>
    </button>
  )
}
