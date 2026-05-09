// ============================================================
// T11 — AI Operating Rhythm
//
// Centro de operaciones: cadencia SAFe-adaptada, objetivos por
// fase, matriz de decisiones, datos a medir.
//
// Tabs:
//   Vista Interactiva — Big Picture clickable (default)
//   Cadencia Detallada — lista expandible de eventos
//   Objetivos por Fase — 5 fases LEAN
//   Decisiones y Escalada — matriz de decisión
//   Datos a Medir — KPIs por nivel
// ============================================================

import { useState, useMemo }              from 'react'
import { PhaseMiniMap }                   from '@/shared/components/PhaseMiniMap'
import { buildOperatingModel }            from './engine'
import { useCompanyProfileStore }         from '@/modules/CompanyProfile/store'
import { useEngagementStore }             from '@/modules/Engagement/store'
import { RecommendationPanel }            from '@/components/RecommendationPanel'
import { buildT11RecommendationContext }  from './t11ContextBuilder'
import {
  T11_LEVEL_CONFIG,
  T11_FREQUENCY_LABEL,
  T11_MATURITY_CONFIG,
  T11_EVENTS_CATALOG,
} from './constants'
import type {
  T11Event, T11Level, T11MaturityTier,
  T11DecisionNode, T11PhaseObjective, T11KpiGroup,
} from './types'
import type { RadarDimension } from '@/shared/components/charts/LeanRadarChart'

// ── Props ─────────────────────────────────────────────────────

interface T11ViewProps {
  companyName: string
  t1Radar:     RadarDimension[]
  employees?:  number
  onBack:      () => void
}

// ── Tabs ──────────────────────────────────────────────────────

type T11Tab = 'bigpicture' | 'cadencia' | 'objetivos' | 'decisiones' | 'kpis'

const TABS: { id: T11Tab; label: string }[] = [
  { id: 'bigpicture',  label: 'Vista Interactiva' },
  { id: 'cadencia',    label: 'Cadencia Detallada' },
  { id: 'objetivos',   label: 'Objetivos por Fase' },
  { id: 'decisiones',  label: 'Decisiones y Escalada' },
  { id: 'kpis',        label: 'Datos a Medir' },
]

// ── MaturityPill ──────────────────────────────────────────────

function MaturityPill({ tier, avg }: { tier: T11MaturityTier; avg: number }) {
  const cfg = T11_MATURITY_CONFIG[tier]
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className="h-2 w-5 rounded-sm transition-all"
            style={{ backgroundColor: s <= cfg.stars ? cfg.hex : '#D4D0C8' }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color: cfg.hex }}>
        {cfg.label}
      </span>
      <span className="text-[10px] text-text-subtle">({avg.toFixed(1)}/4)</span>
    </div>
  )
}

// ── EventDetailPanel — panel lateral deslizante ───────────────

function EventDetailPanel({
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

// ── EventNode — nodo clicable del Big Picture ─────────────────

function EventNode({
  event,
  isUnlocked,
  onClick,
}: {
  event:      T11Event
  isUnlocked: boolean
  onClick:    () => void
}) {
  const lcfg = T11_LEVEL_CONFIG[event.level]

  // Extraer códigos de herramientas de los dataInputs
  const toolCodes = event.dataInputs
    .flatMap((d) => d.match(/T\d+/g) ?? [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 4)

  return (
    <button
      onClick={isUnlocked ? onClick : undefined}
      disabled={!isUnlocked}
      className={[
        'w-full text-left p-3.5 rounded-xl border transition-all duration-150',
        isUnlocked
          ? [
              'bg-white dark:bg-warm-600',
              lcfg.border,
              'hover:shadow-sm hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]',
            ].join(' ')
          : 'border-border bg-surface dark:bg-warm-800 opacity-40 cursor-not-allowed',
      ].join(' ')}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold shrink-0 ${lcfg.badge} ${lcfg.badgeText}`}>
          {T11_FREQUENCY_LABEL[event.frequency]}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {event.isCritical && (
            <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">★</span>
          )}
          {!isUnlocked && (
            <svg className="h-3 w-3 text-text-subtle" viewBox="0 0 12 12" fill="currentColor">
              <path d="M9 5V4a3 3 0 00-6 0v1H2v6h8V5H9zM5 4a1 1 0 012 0v1H5V4z" />
            </svg>
          )}
          <span className="text-[9px] font-mono text-text-subtle">{event.duration}</span>
        </div>
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-lean-black dark:text-warm-50 leading-snug mb-0.5">
        {event.title}
      </p>
      <p className="text-[10px] text-text-subtle dark:text-warm-300 leading-snug line-clamp-2 mb-2.5">
        {event.owner}
      </p>

      {/* Tool badges */}
      {isUnlocked && toolCodes.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {toolCodes.map((code) => (
            <span
              key={code}
              className="px-1.5 py-0.5 rounded text-[8px] font-bold text-white"
              style={{ backgroundColor: lcfg.hex + 'CC' }}
            >
              {code}
            </span>
          ))}
          {isUnlocked && (
            <span className="ml-auto text-[9px]" style={{ color: lcfg.hex }}>
              Ver detalle →
            </span>
          )}
        </div>
      )}
    </button>
  )
}

// ── BigPictureTab ─────────────────────────────────────────────

function BigPictureTab({
  recommendedEvents,
  maturityTier,
  onSelectEvent,
}: {
  recommendedEvents: T11Event[]
  maturityTier:      T11MaturityTier
  onSelectEvent:     (e: T11Event) => void
}) {
  const recommendedIds = new Set(recommendedEvents.map((e) => e.id))
  // Direction en top (strategy flows down), Team en bottom (executes)
  const levelsTop: T11Level[] = ['direction', 'program', 'team']

  return (
    <div className="space-y-2">

      {/* Legend */}
      <div className="flex items-center gap-4 px-1 mb-4 flex-wrap">
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

      {levelsTop.map((level, idx) => {
        const lcfg      = T11_LEVEL_CONFIG[level]
        const allEvents = T11_EVENTS_CATALOG.filter((e) => e.level === level)

        return (
          <div key={level}>
            {/* Band */}
            <div className={`rounded-2xl border-2 ${lcfg.border} overflow-hidden`}>

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

function CadenciaTab({ events }: { events: T11Event[] }) {
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

// ── ObjetivosTab ──────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  listen:      '#6A90C0',
  enable:      '#7C3AED',
  accelerate:  '#D4A85C',
  normalize:   '#5FAF8A',
  scale:       '#C8860A',
}

function ObjetivosTab({ objectives }: { objectives: T11PhaseObjective[] }) {
  const [active, setActive] = useState<string>(objectives[0]?.phase ?? 'listen')
  const current = objectives.find((o) => o.phase === active)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {objectives.map((o) => {
          const color    = PHASE_COLORS[o.phase]
          const isActive = active === o.phase
          return (
            <button
              key={o.phase}
              onClick={() => setActive(o.phase)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                isActive
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white dark:bg-warm-600 text-text-muted dark:text-warm-200 border-border dark:border-warm-500 hover:border-border'
              }`}
              style={isActive ? { backgroundColor: color, borderColor: color } : {}}
            >
              <span className="font-mono">{o.phaseLabel}</span>
              <span className="ml-2 opacity-70 font-normal">{o.sprintRange}</span>
            </button>
          )
        })}
      </div>

      {current && (
        <div className="rounded-2xl border border-border dark:border-warm-500 bg-white dark:bg-warm-600 overflow-hidden">
          <div className="px-6 py-4" style={{ backgroundColor: PHASE_COLORS[current.phase] + '18' }}>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono text-white" style={{ backgroundColor: PHASE_COLORS[current.phase] }}>
                {current.phaseLabel}
              </span>
              <span className="text-sm font-semibold text-lean-black dark:text-warm-50">{current.sprintRange}</span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-3">Objetivos del periodo</p>
              <ol className="space-y-2 list-decimal list-inside">
                {current.objectives.map((obj) => (
                  <li key={obj} className="text-xs text-text-muted dark:text-warm-200 leading-relaxed">{obj}</li>
                ))}
              </ol>
            </div>

            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-3">Eventos clave</p>
              <ul className="space-y-1.5">
                {current.keyEvents.map((e) => (
                  <li key={e} className="flex items-start gap-2 text-xs text-text-muted dark:text-warm-200">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: PHASE_COLORS[current.phase] }} />
                    {e}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-3">Datos necesarios</p>
              <ul className="space-y-1.5">
                {current.dataNeeded.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-xs text-text-muted dark:text-warm-200">
                    <span className="font-mono text-[10px] shrink-0" style={{ color: PHASE_COLORS[current.phase] }}>→</span>
                    {d}
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

// ── DecisionesTab ─────────────────────────────────────────────

function DecisionCard({ node }: { node: T11DecisionNode }) {
  const lcfg = T11_LEVEL_CONFIG[node.level]

  return (
    <div className={`rounded-xl border ${lcfg.border} bg-white dark:bg-warm-600 overflow-hidden`}>
      <div className={`px-4 py-3 ${lcfg.bg}`}>
        <div className="flex items-start gap-2">
          <span className={`text-[9px] font-mono font-bold shrink-0 mt-0.5 ${lcfg.badgeText}`}>TRIGGER</span>
          <p className="text-xs font-semibold text-lean-black dark:text-warm-50 leading-snug">{node.trigger}</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2.5">
        <div>
          <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">Decisión</p>
          <p className="text-[11px] text-lean-black dark:text-warm-100">{node.decision}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: 'Owner', value: node.owner },
            { label: 'Valida', value: node.validator },
            { label: 'Escala a', value: node.escalateTo },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle mb-0.5">{item.label}</p>
              <p className="text-[11px] text-text-muted dark:text-warm-200">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 pt-0.5">
          <svg className="h-3 w-3 text-text-subtle shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3.5l2 1.5" />
          </svg>
          <p className="text-[10px] text-text-subtle">
            Plazo: <span className="font-medium text-text-muted dark:text-warm-200">{node.timeline}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function DecisionesTab({ decisions }: { decisions: T11DecisionNode[] }) {
  const levels: T11Level[] = ['team', 'program', 'direction']

  return (
    <div className="space-y-8">
      {levels.map((level) => {
        const lvDecisions = decisions.filter((d) => d.level === level)
        if (!lvDecisions.length) return null
        const lcfg = T11_LEVEL_CONFIG[level]

        return (
          <div key={level}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
              <div className={`px-3 py-1 rounded-full text-[10px] font-semibold ${lcfg.badge} ${lcfg.badgeText}`}>
                {lcfg.label}
              </div>
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lvDecisions.map((node) => (
                <DecisionCard key={node.id} node={node} />
              ))}
            </div>
          </div>
        )
      })}

      <div className="rounded-xl border border-border dark:border-warm-500 bg-surface dark:bg-warm-800 px-5 py-4">
        <p className="text-[11px] text-text-subtle dark:text-warm-300 leading-relaxed">
          <span className="font-semibold text-text-muted dark:text-warm-200">Nota sobre escalada:</span> Si un decisor no está disponible en el plazo indicado, la decisión escala automáticamente al nivel superior. Ninguna decisión debe quedar bloqueada más de 2× el plazo base.
        </p>
      </div>
    </div>
  )
}

// ── KpisTab ───────────────────────────────────────────────────

function KpisTab({ kpiGroups }: { kpiGroups: T11KpiGroup[] }) {
  return (
    <div className="space-y-8">
      {kpiGroups.map((group) => {
        const lcfg = T11_LEVEL_CONFIG[group.level]

        return (
          <div key={group.level}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
              <div className={`px-3 py-1 rounded-full text-[10px] font-semibold ${lcfg.badge} ${lcfg.badgeText}`}>
                {group.label}
              </div>
              <div className="h-px flex-1" style={{ backgroundColor: lcfg.hex + '40' }} />
            </div>

            <div className="rounded-xl border border-border dark:border-warm-500 bg-white dark:bg-warm-600 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border dark:border-warm-500">
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle">KPI</th>
                    <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle hidden sm:table-cell">Cómo se calcula</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Fuente</th>
                    <th className="text-center px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-text-subtle">Frecuencia</th>
                  </tr>
                </thead>
                <tbody>
                  {group.kpis.map((kpi, i) => (
                    <tr key={kpi.name} className={`border-b border-border/50 dark:border-warm-500/50 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-warm-700/30'}`}>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-lean-black dark:text-warm-50">{kpi.name}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-[11px] text-text-muted dark:text-warm-300 font-mono">{kpi.formula}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: lcfg.hex }}>
                          {kpi.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-[10px] text-text-subtle dark:text-warm-300">{kpi.cadence}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Export HTML ───────────────────────────────────────────────

function generateOperatingModelHTML(
  companyName: string,
  model: ReturnType<typeof buildOperatingModel>,
): string {
  const now    = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
  const matCfg = T11_MATURITY_CONFIG[model.maturityTier]

  const eventsHTML = model.recommendedEvents.map((e) => {
    const lcfg = T11_LEVEL_CONFIG[e.level]
    return `<tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#1a1a1a;">${e.title}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${lcfg.label}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${T11_FREQUENCY_LABEL[e.frequency]}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${e.duration}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${e.owner}</td>
    </tr>`
  }).join('')

  const decisionsHTML = model.decisions.map((d) => `
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 12px;font-size:11px;color:#374151;">${d.trigger}</td>
      <td style="padding:10px 12px;font-size:11px;font-weight:600;color:#1a1a1a;">${d.owner}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${d.escalateTo}</td>
      <td style="padding:10px 12px;font-size:11px;color:#6b7280;">${d.timeline}</td>
    </tr>`).join('')

  const kpiHTML = model.kpiGroups.map((g) => `
    <h3 style="font-size:13px;font-weight:600;color:#374151;margin:24px 0 12px;">${g.label}</h3>
    ${g.kpis.map((k) => `
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid #f3f4f6;">
      <div>
        <p style="font-size:12px;font-weight:600;color:#1a1a1a;margin:0 0 2px;">${k.name}</p>
        <p style="font-size:10px;color:#9ca3af;font-family:monospace;margin:0;">${k.formula}</p>
      </div>
      <div style="text-align:right;flex-shrink:0;margin-left:16px;">
        <span style="font-size:10px;background:#f3f4f6;padding:2px 6px;border-radius:4px;color:#374151;">${k.source}</span>
        <p style="font-size:10px;color:#9ca3af;margin:4px 0 0;">${k.cadence}</p>
      </div>
    </div>`).join('')}`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>AI Operating Rhythm — ${companyName}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;margin:0;padding:40px;background:#fff}
    h2{font-size:15px;font-weight:700;color:#374151;margin:32px 0 12px;padding-bottom:8px;border-bottom:2px solid #f3f4f6}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    th{background:#f9fafb;text-align:left;padding:10px 12px;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;font-weight:600}
    @media print{body{padding:20px}}
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
    <div>
      <p style="font-size:10px;font-family:monospace;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin:0 0 6px;">L.E.A.N. AI System · T11</p>
      <h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">AI Operating Rhythm</h1>
      <p style="font-size:13px;color:#6b7280;margin:0;">${companyName}</p>
    </div>
    <div style="text-align:right;">
      <p style="font-size:10px;color:#9ca3af;margin:0;">Generado el ${now}</p>
      <p style="font-size:11px;font-weight:600;margin:4px 0 0;color:${matCfg.hex};">Madurez IA: ${matCfg.label} (${model.maturityAvg.toFixed(1)}/4)</p>
    </div>
  </div>
  <div style="display:flex;gap:16px;margin:24px 0;">
    ${[
      { v: model.maturityAvg.toFixed(1), l: 'Índice de madurez IA', c: matCfg.hex },
      { v: model.recommendedEvents.length, l: 'Eventos de gobierno', c: '#C8860A' },
      { v: model.decisions.length,         l: 'Nodos de decisión', c: '#6A90C0' },
      { v: model.kpiGroups.reduce((a, g) => a + g.kpis.length, 0), l: 'KPIs definidos', c: '#5FAF8A' },
    ].map(k => `<div style="flex:1;background:#f9fafb;border-radius:12px;padding:16px 20px;">
      <div style="font-size:28px;font-weight:700;color:${k.c};">${k.v}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px;">${k.l}</div>
    </div>`).join('')}
  </div>
  <h2>Cadencia de Gobierno Recomendada</h2>
  <table><thead><tr><th>Evento</th><th>Nivel</th><th>Frecuencia</th><th>Duración</th><th>Responsable</th></tr></thead>
  <tbody>${eventsHTML}</tbody></table>
  <h2>Matriz de Decisiones y Escalada</h2>
  <table><thead><tr><th>Trigger</th><th>Owner</th><th>Escala a</th><th>Plazo</th></tr></thead>
  <tbody>${decisionsHTML}</tbody></table>
  <h2>KPIs por Nivel de Gobierno</h2>${kpiHTML}
  <p style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;">
    Generado por L.E.A.N. AI System Enterprise · Alpha Consulting Solutions S.L. · ${now}
  </p>
</body>
</html>`
}

// ── Vista principal ───────────────────────────────────────────

export function T11View({ companyName, t1Radar, employees = 500, onBack }: T11ViewProps) {
  const [activeTab, setActiveTab]         = useState<T11Tab>('bigpicture')
  const [selectedEvent, setSelectedEvent] = useState<T11Event | null>(null)
  const { profile: companyProfile }       = useCompanyProfileStore()
  const engagementId                      = useEngagementStore((s) => s.activeEngagementId)

  const model = useMemo(
    () => buildOperatingModel({ radar: t1Radar, employees }),
    [t1Radar, employees],
  )

  const t11LLMContext = useMemo(
    () => companyProfile ? buildT11RecommendationContext(model, companyProfile) : null,
    [model, companyProfile],
  )

  const { maturityTier, maturityAvg, recommendedEvents, decisions, phaseObjectives, kpiGroups } = model
  const matCfg        = T11_MATURITY_CONFIG[maturityTier]
  const criticalCount = recommendedEvents.filter((e) => e.isCritical).length
  const totalKpis     = kpiGroups.reduce((acc, g) => acc + g.kpis.length, 0)

  function handleExport() {
    const html = generateOperatingModelHTML(companyName, model)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `OperatingRhythm_${companyName.replace(/\s+/g, '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-warm-900">

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-white dark:bg-warm-800 border-b border-border dark:border-warm-600">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-text-subtle dark:text-warm-300 hover:text-text-muted dark:hover:text-warm-100 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M8 2L4 6l4 4" />
            </svg>
            Inicio
          </button>

          <div className="h-4 w-px bg-border dark:bg-warm-600" />

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              T11
            </span>
            <span className="text-xs font-semibold text-lean-black dark:text-warm-50">
              AI Operating Rhythm
            </span>
          </div>

          <div className="flex-1 flex justify-center">
            <PhaseMiniMap phaseId="normalize" toolCode="T11" />
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-navy text-white hover:opacity-90 transition-opacity"
          >
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 1v7M3 5l3 3 3-3M1 9v1.5A1.5 1.5 0 002.5 12h7A1.5 1.5 0 0011 10.5V9" />
            </svg>
            Exportar modelo operativo
          </button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Hero */}
        <div className="rounded-2xl bg-white dark:bg-warm-700 border border-border dark:border-warm-500 px-6 py-5">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-subtle dark:text-warm-300 mb-1">
                {companyName} · Modelo Operativo IA
              </p>
              <h1 className="text-xl font-bold text-lean-black dark:text-warm-50">AI Operating Rhythm</h1>
              <p className="text-sm text-text-muted dark:text-warm-300 mt-1">
                Centro de operaciones basado en SAFe Agile + ISO 42001
              </p>
            </div>
            <div className="space-y-2">
              <MaturityPill tier={maturityTier} avg={maturityAvg} />
              <p className="text-[11px] text-text-subtle dark:text-warm-300 max-w-xs">{matCfg.description}</p>
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: recommendedEvents.length, label: 'Eventos de gobierno',  sub: 'en la cadencia recomendada', color: '#C8860A' },
            { value: criticalCount,            label: 'Eventos críticos',      sub: 'de implementación inmediata', color: '#C06060' },
            { value: decisions.length,         label: 'Nodos de decisión',     sub: 'mapeados con escalada', color: '#6A90C0' },
            { value: totalKpis,                label: 'KPIs definidos',        sub: 'en los 3 niveles de gobierno', color: '#5FAF8A' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl bg-white dark:bg-warm-700 border border-border dark:border-warm-500 px-5 py-4">
              <p className="text-2xl font-bold tabular-nums" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-xs font-semibold text-lean-black dark:text-warm-50 mt-0.5">{kpi.label}</p>
              <p className="text-[10px] text-text-subtle dark:text-warm-300 mt-0.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-border dark:border-warm-500 bg-white dark:bg-warm-700 px-6 py-5">
          <p className="text-[9px] font-mono uppercase tracking-widest text-text-subtle dark:text-warm-300 mb-3">
            ¿Cómo funciona este modelo?
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Cadencia de Sprint (Equipo)',       body: 'Cada 2 semanas: planificación + review de use cases IA. El equipo sabe qué hacer, cuándo y con qué datos. Operación ágil sin burocracia.',  color: T11_LEVEL_CONFIG.team.hex },
              { title: 'Comités de Programa (Mensual)',     body: 'Supervisión mensual de riesgos, compliance y proveedores. El CIO/COO tiene visibilidad sin estar en el día a día. Decisiones de programa con datos.', color: T11_LEVEL_CONFIG.program.hex },
              { title: 'Dirección Estratégica (Trimestral)', body: 'PI Planning + Steering Committee: objetivos del trimestre, ROI, inversión. El C-suite gobierna la transformación IA sin microgestionar.', color: T11_LEVEL_CONFIG.direction.hex },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-xs font-semibold text-lean-black dark:text-warm-50 mb-1">{item.title}</p>
                  <p className="text-[11px] text-text-muted dark:text-warm-300 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-warm-800 mb-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex-1 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150',
                  activeTab === tab.id
                    ? 'bg-white dark:bg-warm-600 text-lean-black dark:text-warm-50 shadow-sm'
                    : 'text-text-muted dark:text-warm-300 hover:text-lean-black dark:hover:text-warm-100',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'bigpicture'  && (
            <BigPictureTab
              recommendedEvents={recommendedEvents}
              maturityTier={maturityTier}
              onSelectEvent={setSelectedEvent}
            />
          )}
          {activeTab === 'cadencia'   && <CadenciaTab   events={recommendedEvents} />}
          {activeTab === 'objetivos'  && <ObjetivosTab  objectives={phaseObjectives} />}
          {activeTab === 'decisiones' && <DecisionesTab decisions={decisions} />}
          {activeTab === 'kpis'       && <KpisTab       kpiGroups={kpiGroups} />}
        </div>

        {/* SAFe note */}
        <div className="rounded-xl border border-border dark:border-warm-500 bg-surface dark:bg-warm-800 px-5 py-4">
          <p className="text-[10px] text-text-subtle dark:text-warm-300 leading-relaxed">
            <span className="font-semibold text-text-muted dark:text-warm-200">Metodología:</span> Este modelo operativo adapta el framework SAFe® (Scaled Agile Framework) al gobierno de sistemas IA, integrando los requisitos del estándar ISO 42001:2023 (AI Management System) y el EU AI Act (Reglamento 2024/1689). La cadencia recomendada se ajusta automáticamente al nivel de madurez IA de la organización medido en T1.
          </p>
        </div>
      </div>

      {/* ── Event detail panel ── */}
      <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />

      {/* ── RECOMENDACIONES IA ──────────────────────────────── */}
      {t11LLMContext && (
        <div className="max-w-5xl mx-auto w-full px-8 pb-8">
          <RecommendationPanel
            tool="t11"
            title="Recomendaciones IA — Modelo Operativo"
            subtitle="Generadas por Claude · Específicas para este modelo de gobierno"
            context={t11LLMContext}
            engagementId={engagementId}
          />
        </div>
      )}
    </div>
  )
}
