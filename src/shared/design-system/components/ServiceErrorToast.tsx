import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
// ServiceErrorToast — toast persistente para errores de servicio
//
// Diseño: fondo claro + borde izquierdo danger + icono AlertCircle
// Badge "DBG" expande panel técnico con detalles del error (para debug en caliente).
// Siempre persistente: el usuario debe cerrarlo manualmente.
// ─────────────────────────────────────────────────────────────

export interface ServiceErrorToastProps {
  /** Mensaje amigable mostrado al usuario */
  message?: string
  /** Objeto de error técnico (Supabase, Edge Function, etc.) */
  error?: unknown
  /** Callback de cierre */
  onClose: () => void
}

function extractDebugInfo(error: unknown): string {
  if (!error) return 'No hay información de error disponible.'
  if (error instanceof Error) {
    const lines: string[] = [`message: ${error.message}`]
    if ('hint' in error && error.hint) lines.push(`hint: ${String(error.hint)}`)
    if ('code' in error && error.code)  lines.push(`code: ${String(error.code)}`)
    if ('details' in error && error.details) lines.push(`details: ${String(error.details)}`)
    if (error.stack) lines.push(`\nstack:\n${error.stack}`)
    return lines.join('\n')
  }
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

export function ServiceErrorToast({
  message = 'El servidor tardó demasiado o encontró un error. Inténtalo de nuevo.',
  error,
  onClose,
}: ServiceErrorToastProps) {
  const [debugOpen, setDebugOpen] = useState(false)
  const debugInfo = extractDebugInfo(error)

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col w-[calc(100vw-32px)] sm:w-auto sm:min-w-[320px] sm:max-w-sm rounded-xl shadow-md bg-white dark:bg-warm-800 border border-border border-l-4 border-l-danger animate-fade-in"
    >
      {/* ── Fila principal ── */}
      <div className="flex items-start gap-3 p-4">

        {/* Icono AlertCircle */}
        <span className="shrink-0 mt-0.5" aria-hidden="true">
          <svg
            className="h-5 w-5 text-danger"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>

        {/* Mensaje */}
        <p className="flex-1 text-sm text-lean-black dark:text-warm-50 leading-snug">
          {message}
        </p>

        {/* Botón cerrar X */}
        <button
          onClick={onClose}
          aria-label="Cerrar notificación"
          className="shrink-0 -mt-0.5 -mr-0.5 p-1 rounded text-text-muted hover:text-lean-black dark:hover:text-warm-50 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      {/* ── Fila inferior: badge DBG ── */}
      <div className="flex justify-end px-4 pb-3">
        <button
          onClick={() => setDebugOpen((v) => !v)}
          aria-expanded={debugOpen}
          aria-controls="service-error-debug"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-widest bg-warm-800 dark:bg-warm-900 text-warm-200 dark:text-warm-400 hover:bg-warm-700 dark:hover:bg-warm-800 transition-colors border border-warm-700/40"
        >
          <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 1v10M1 6h10" />
          </svg>
          DBG
        </button>
      </div>

      {/* ── Panel de debug expandible ── */}
      {debugOpen && (
        <div
          id="service-error-debug"
          className="border-t border-border mx-0 rounded-b-xl overflow-hidden"
        >
          <pre
            className="p-3 text-[10px] font-mono text-text-muted dark:text-warm-400 bg-warm-50 dark:bg-warm-900/60 whitespace-pre-wrap break-all leading-relaxed max-h-48 overflow-y-auto"
          >
            {debugInfo}
          </pre>
        </div>
      )}
    </div>
  )
}
