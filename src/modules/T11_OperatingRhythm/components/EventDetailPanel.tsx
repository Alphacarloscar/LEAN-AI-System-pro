// EventDetailPanel — panel lateral deslizante con detalle de un evento

import { T11_LEVEL_CONFIG, T11_FREQUENCY_LABEL } from '../constants'
import type { T11Event } from '../types'

export function EventDetailPanel({
  event,
  onClose,
}: {
  event:   T11Event | null
  onClose: () => void
}) {
  if (!event) return null
  const lcfg = T11_LEVEL_CONFIG[event.level]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-lean-black/20 dark:bg-warm-950/60 z-40"
        onClick={onClose}
      />
      {/* Panel */}
      <aside className="fixed right-0 top-0 h-full w-[400px] max-w-[92vw] bg-white dark:bg-warm-800 border-l border-border dark:border-warm-600 z-50 overflow-y-auto animate-slide-in-right shadow-xl">

        {/* Panel header */}
        <div className={`px-5 py-4 ${lcfg.bg} border-b border-border dark:border-warm-600 sticky top-0 z-10`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${lcfg.badge} ${lcfg.badgeText}`}>
                  {T11_FREQUENCY_LABEL[event.frequency]}
                </span>
                {event.isCritical && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    CRÍTICO
                  </span>
                )}
                <span className="text-[10px] font-mono text-text-subtle">{event.duration}</span>
              </div>
              <p className="text-sm font-bold text-lean-black dark:text-warm-50 leading-snug">
                {event.title}
              </p>
              <p className="text-[11px] text-text-subtle mt-0.5">{event.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-text-subtle hover:text-text-muted p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-warm-700 transition-colors shrink-0"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 4L4 12M4 4l8 8" />
              </svg>
            </button>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            <span className="font-medium">Owner:</span> {event.owner}
          </p>
        </div>

        {/* Panel body */}
        <div className="p-5 space-y-5">

          {/* Participantes */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-2">
              Participantes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {event.participants.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 dark:bg-warm-700 text-text-muted dark:text-warm-100">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Datos que se revisan */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-2">
              Datos que se revisan
            </p>
            <ul className="space-y-1.5">
              {event.dataInputs.map((d) => (
                <li key={d} className="flex items-start gap-2 text-[11px] text-text-muted dark:text-warm-200">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: lcfg.hex }} />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          {/* Agenda tipo */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-2">
              Agenda tipo
            </p>
            <ol className="space-y-2">
              {event.agendaItems.map((a, i) => (
                <li key={a} className="flex items-start gap-2.5 text-[11px] text-text-muted dark:text-warm-200 leading-snug">
                  <span
                    className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0"
                    style={{ backgroundColor: lcfg.hex }}
                  >
                    {i + 1}
                  </span>
                  {a}
                </li>
              ))}
            </ol>
          </div>

          {/* KPIs */}
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-2">
              KPIs que se revisan
            </p>
            <ul className="space-y-1.5">
              {event.kpisReviewed.map((k) => (
                <li key={k} className="flex items-start gap-2 text-[11px] text-text-muted dark:text-warm-200">
                  <span className="font-mono text-[10px] shrink-0" style={{ color: lcfg.hex }}>→</span>
                  {k}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </>
  )
}
