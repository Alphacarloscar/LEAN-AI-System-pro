// ============================================================
// RetryBanner — Banner de error de carga con botón de reintento
//
// Aparece cuando un store T(n) falla al cargar datos desde
// Supabase. Muestra el mensaje de error exacto para diagnóstico
// y ofrece un botón "Reintentar" que re-ejecuta el load.
//
// Paleta: Obsidian Amber — warm charcoal + amber warning
// ============================================================

interface RetryBannerProps {
  /** Mensaje de error tal cual viene de loadError del store */
  message:  string
  /** Callback para reintentar la carga */
  onRetry:  () => void
  /** Texto opcional del botón (default: "Reintentar") */
  retryLabel?: string
}

export function RetryBanner({ message, onRetry, retryLabel = 'Reintentar' }: RetryBannerProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[320px] gap-5 px-6">
      {/* Icono de alerta */}
      <div
        className="flex items-center justify-center w-14 h-14 rounded-2xl"
        style={{ background: 'rgba(200,134,10,0.10)' }}
      >
        <svg
          width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="#C8860A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      {/* Mensaje */}
      <div className="flex flex-col items-center gap-1.5 max-w-md text-center">
        <p className="text-sm font-medium text-[#2A2822] dark:text-white/80">
          Error al cargar los datos
        </p>
        <p
          className="text-xs font-mono leading-relaxed text-[#2A2822]/50 dark:text-white/35 break-all"
        >
          {message}
        </p>
      </div>

      {/* Botón de reintento */}
      <button
        onClick={onRetry}
        className={[
          'flex items-center gap-2 px-5 py-2.5 rounded-xl',
          'text-sm font-medium text-white',
          'bg-[#C8860A] hover:bg-[#B57609] active:scale-95',
          'transition-all duration-150',
        ].join(' ')}
      >
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
        </svg>
        {retryLabel}
      </button>
    </div>
  )
}
