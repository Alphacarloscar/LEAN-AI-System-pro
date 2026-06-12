// CadenciaTab — lista expandible de eventos por nivel
// Incluye EventCard (tarjeta expandible individual)

import { useState } from 'react'
import { T11_LEVEL_CONFIG, T11_FREQUENCY_LABEL } from '../constants'
import type { T11Event, T11Level } from '../types'

// ── EventCard — tarjeta expandible de Cadencia Detallada ──────

function EventCard({ event }: { event: T11Event }) {
  const [expanded, setExpanded] = useState(false)
  const lcfg = T11_LEVEL_CONFIG[event.level]

  return (
    <div className={`rounded-xl border transition-all duration-200 ${lcfg.border} bg-white dark:bg-warm-600`}>
      <button
        className="w-full text-left px-4 py-3.5 flex items-start gap-3"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={`mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-semibold shrink-0 ${lcfg.badge} ${lcfg.badgeText}`}>
          {T11_FREQUENCY_LABEL[event.frequency]}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-xs font-semibold text-lean-black dark:text-warm-50 leading-snug">
                  {event.title}
                </p>
                {event.isCritical && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                    CRÍTICO
                  </span>
                )}
              </div>
              <p className="text-[10px] text-text-subtle mt-0.5 leading-snug">{event.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-text-muted font-mono">{event.duration}</span>
              <svg
                className={`h-3 w-3 text-text-subtle transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
              >
                <path d="M2 4l4 4 4-4" />
              </svg>
            </div>
          </div>
          <p className="text-[10px] text-text-subtle mt-1">
            <span className="font-medium text-text-muted dark:text-warm-200">Owner:</span> {event.owner}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border dark:border-warm-500 px-4 py-4 space-y-4">
          <p className="text-[11px] text-text-muted dark:text-warm-200 leading-relaxed">
            {event.subtitle}
          </p>

          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">Participantes</p>
            <div className="flex flex-wrap gap-1.5">
              {event.participants.map((p) => (
                <span key={p} className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 dark:bg-warm-700 text-text-muted dark:text-warm-100">
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">Datos a revisar</p>
            <ul className="space-y-1">
              {event.dataInputs.map((d) => (
                <li key={d} className="flex items-start gap-1.5 text-[11px] text-text-muted dark:text-warm-200">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: lcfg.hex }} />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">Agenda tipo</p>
              <ol className="space-y-1 list-decimal list-inside">
                {event.agendaItems.map((a) => (
                  <li key={a} className="text-[11px] text-text-muted dark:text-warm-200 leading-snug">{a}</li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-1.5">KPIs que se revisan</p>
              <ul className="space-y-1">
                {event.kpisReviewed.map((k) => (
                  <li key={k} className="flex items-start gap-1.5 text-[11px] text-text-muted dark:text-warm-200">
                    <span className="font-mono text-[10px] shrink-0" style={{ color: lcfg.hex }}>→</span>
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── CadenciaTab ───────────────────────────────────────────────

export function CadenciaTab({ events }: { events: T11Event[] }) {
  const levels: T11Level[] = ['team', 'program', 'direction']

  return (
    <div className="space-y-8">
      {levels.map((level) => {
        const lvEvents = events.filter((e) => e.level === level)
        if (!lvEvents.length) return null
        const lcfg = T11_LEVEL_CONFIG[level]

        return (
          <div key={level}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
              <div className={`px-3 py-1 rounded-full text-[10px] font-semibold ${lcfg.badge} ${lcfg.badgeText}`}>
                {lcfg.label}
              </div>
              <p className="text-[10px] text-text-subtle">{lcfg.sublabel}</p>
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
            </div>
            <div className="grid grid-cols-1 gap-3">
              {lvEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
