// BigPictureTab — vista interactiva con bandas por nivel y nodos clicables

import { T11_LEVEL_CONFIG, T11_EVENTS_CATALOG, T11_MATURITY_CONFIG } from '../constants'
import type { T11Event, T11Level, T11MaturityTier, T11AdaptiveMode } from '../types'
import { EventNode } from './EventNode'

export function BigPictureTab({
  recommendedEvents,
  maturityTier,
  adaptiveMode,
  onSelectEvent,
}: {
  recommendedEvents: T11Event[]
  maturityTier:      T11MaturityTier
  adaptiveMode:      T11AdaptiveMode
  onSelectEvent:     (e: T11Event) => void
}) {
  const recommendedIds = new Set(recommendedEvents.map((e) => e.id))
  const levelsTop: T11Level[] = ['direction', 'program', 'team']

  return (
    <div className="space-y-2">

      {/* Legend */}
      <div className="flex items-center gap-4 px-1 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] text-text-subtle">
          <svg className="h-3 w-3 text-amber-500" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 1l1.5 3L11 4.5 8.5 7l.5 3.5L6 9 3 10.5 3.5 7 1 4.5 4.5 4z"/>
          </svg>
          Evento crítico
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-subtle">
          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white bg-info-dark">T6</span>
          Herramienta de entrada
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-subtle">
          <svg className="h-3 w-3 text-text-subtle" viewBox="0 0 12 12" fill="currentColor">
            <path d="M9 5V4a3 3 0 00-6 0v1H2v6h8V5H9zM5 4a1 1 0 012 0v1H5V4z"/>
          </svg>
          Disponible en mayor madurez · Nivel {T11_MATURITY_CONFIG[maturityTier].label}
        </div>
      </div>

      {/* Callout adaptativo — solo en modo básico */}
      {adaptiveMode === 'basic' && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50 dark:bg-red-900/15 px-4 py-3">
          <svg className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3M8 11h.01" />
          </svg>
          <div>
            <p className="text-[11px] font-semibold text-red-700 dark:text-red-400 mb-0.5">Modo Básico activo</p>
            <p className="text-[10px] text-red-600/80 dark:text-red-400/70 leading-relaxed">
              Tu madurez IA está por debajo de 2.0. Se muestran únicamente las ceremonias esenciales para no sobrecargar la organización.
              Los eventos adicionales se desbloquearán automáticamente al superar ese umbral.
            </p>
          </div>
        </div>
      )}

      {levelsTop.map((level, idx) => {
        const lcfg      = T11_LEVEL_CONFIG[level]
        const allEvents = T11_EVENTS_CATALOG.filter((e) => e.level === level)

        return (
          <div key={level}>
            {/* Band */}
            <div className={`rounded-xl border-2 ${lcfg.border} overflow-hidden`}>
              {/* Band header */}
              <div className={`px-4 py-2 ${lcfg.bg} flex items-center gap-3`}>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${lcfg.badge} ${lcfg.badgeText}`}>
                  {lcfg.label}
                </span>
                <p className="text-[10px] text-text-subtle">{lcfg.sublabel}</p>
              </div>
              {/* Event nodes */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {allEvents.map((event) => (
                  <EventNode
                    key={event.id}
                    event={event}
                    isUnlocked={recommendedIds.has(event.id)}
                    onClick={() => onSelectEvent(event)}
                  />
                ))}
              </div>
            </div>

            {/* Connector */}
            {idx < levelsTop.length - 1 && (
              <div className="flex items-center justify-center h-8">
                <div className="flex flex-col items-center gap-0.5 opacity-40">
                  <div className="h-3 w-0.5 bg-text-subtle" />
                  <svg className="h-3.5 w-3.5 text-text-subtle" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 2v10M4 8l3 4 3-4" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
