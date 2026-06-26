// ============================================================
// PersistenceBanner — Banner inline de fallo de guardado en nube
//
// Aparece cuando la Edge Function genera contenido pero
// save_tool_output falla. El usuario ve el contenido generado
// pero sabe que no está guardado en Supabase.
//
// No es un error de generación — el contenido ES válido.
// El problema es la persistencia, no la IA.
//
// Paleta: Obsidian Amber
// ============================================================

import { Spinner } from '@shared/design-system/components'

interface PersistenceBannerProps {
  /** Mensaje de error técnico de save_tool_output (para diagnóstico) */
  error:      string | null
  /** true mientras retrySave() está en curso */
  isRetrying: boolean
  /** Callback del botón "Reintentar guardado" */
  onRetry:    () => void
}

export function PersistenceBanner({ error, isRetrying, onRetry }: PersistenceBannerProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border"
      style={{
        background:   'rgba(200,134,10,0.07)',
        borderColor:  'rgba(200,134,10,0.30)',
      }}
    >
      {/* Icono alerta */}
      <svg
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#C8860A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="shrink-0"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9"    x2="12"    y2="13" />
        <line x1="12" y1="17"   x2="12.01" y2="17" />
      </svg>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: '#B57609' }}>
          Contenido generado pero no guardado en la nube.
        </p>
        {error && (
          <p className="text-xs font-mono mt-0.5 truncate" style={{ color: 'rgba(181,118,9,0.65)' }}>
            {error}
          </p>
        )}
      </div>

      {/* Botón reintento */}
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className={[
          'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
          'text-xs font-medium text-white',
          'transition-all duration-150',
          isRetrying
            ? 'opacity-60 cursor-not-allowed bg-[#C8860A]'
            : 'bg-[#C8860A] hover:bg-[#B57609] active:scale-95',
        ].join(' ')}
      >
        {isRetrying ? (
          <>
            <Spinner size="sm" label="Guardando…" className="text-white" />
            Guardando…
          </>
        ) : (
          <>
            <svg
              width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
            Reintentar guardado
          </>
        )}
      </button>
    </div>
  )
}
