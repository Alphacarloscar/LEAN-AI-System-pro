// DashboardHeader — cabecera oscura con índice IA global y sprint

export function DashboardHeader({
  displayName,
  displaySector,
  displayTamano,
  aiDisplay,
  tier,
  isReadOnly,
}: {
  displayName:    string
  displaySector:  string
  displayTamano:  string
  aiDisplay:      number
  tier:           string
  isReadOnly:     boolean
}) {
  return (
    <div className="bg-lean-black dark:bg-warm-950">
      <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-warm-300 mb-0.5">
            {[displaySector, displayTamano].filter(Boolean).join(' · ')}
          </p>
          <h1 className="text-base font-semibold text-warm-50 leading-tight">{displayName}</h1>
        </div>
        <div className="text-center flex-1">
          <p className="text-xs font-mono uppercase tracking-widest text-warm-400 mb-1">Índice IA global</p>
          <div className="flex items-baseline gap-1.5 justify-center">
            <span className="text-[2.5rem] font-semibold leading-none text-gold tabular-nums tracking-tight">
              {aiDisplay.toFixed(1)}
            </span>
            <span className="text-lg text-warm-400 leading-none">/ 4.0</span>
          </div>
          <p className="text-xs text-warm-300 mt-0.5">{tier}</p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />Sprint 3 / 6
          </span>
          <p className="text-xs text-warm-400 mt-1">Mayo 2026</p>
        </div>
      </div>

      {/* Banner solo-lectura */}
      {isReadOnly && (
        <div className="border-t border-warm-700">
          <div className="max-w-7xl mx-auto px-8 py-2 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#9BB5D9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7" width="10" height="7" rx="1.5" />
              <path d="M5 7V5a3 3 0 016 0v2" />
            </svg>
            <span className="text-xs font-mono uppercase tracking-widest text-info-dark dark:text-info">
              Proyecto de tu empresa · Solo lectura — no puedes guardar cambios en este proyecto
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
