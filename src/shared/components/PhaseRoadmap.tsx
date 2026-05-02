import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
// PhaseRoadmap — Metro Map visual del sprint L.E.A.N. de 6 fases
//
// Concepto: cada fase es una "estación" en una línea de metro.
// La posición actual está marcada con una animación de pulso.
// Click en una estación → panel de detalle con herramientas.
//
// Uso:
//   <PhaseRoadmap phases={leanPhases} onToolClick={(phase, tool) => ...} />
// ─────────────────────────────────────────────────────────────

// ── Types ──────────────────────────────────────────────────────

export type PhaseStatus = 'complete' | 'active' | 'upcoming' | 'locked'
export type ToolStatus  = 'complete' | 'in_progress' | 'pending' | 'blocked'

export interface PhaseTool {
  code:         string   // T1–T13
  name:         string
  status:       ToolStatus
  description?: string
  output?:      string   // entregable principal de la herramienta
}

export interface LeanPhase {
  id:           string
  label:        string
  shortLabel?:  string   // etiqueta corta para la estación en mobile
  status:       PhaseStatus
  tools:        PhaseTool[]
  description?: string
  duration?:    string   // ej. "Semanas 1–4"
}

export interface PhaseRoadmapProps {
  phases:       LeanPhase[]
  className?:   string
  onToolClick?: (phase: LeanPhase, tool: PhaseTool) => void
  readOnly?:    boolean
}

// ── Config visual por estado de fase ──────────────────────────

const phaseNodeCfg: Record<PhaseStatus, {
  node:   string
  icon:   'check' | 'play' | 'number' | 'lock'
  label:  string
}> = {
  complete: {
    node:  'bg-navy border-navy dark:bg-warm-600 dark:border-warm-300',
    icon:  'check',
    label: 'text-lean-black dark:text-gray-100 font-semibold',
  },
  active: {
    node:  'bg-white border-navy dark:bg-gray-900 dark:border-warm-300',
    icon:  'play',
    label: 'text-navy dark:text-warm-100 font-bold',
  },
  upcoming: {
    node:  'bg-white border-border dark:bg-gray-900 dark:border-gray-600',
    icon:  'number',
    label: 'text-text-muted',
  },
  locked: {
    node:  'bg-gray-100 border-border dark:bg-gray-800 dark:border-gray-700',
    icon:  'lock',
    label: 'text-text-subtle',
  },
}

// ── Config visual por estado de herramienta ────────────────────

const toolCfg: Record<ToolStatus, { dot: string; chip: string; label: string }> = {
  complete:    { dot: 'bg-success-dark',                     chip: 'bg-success-light  border-success/30  text-success-dark',              label: 'Completada' },
  in_progress: { dot: 'bg-warning-dark',                     chip: 'bg-warning-light  border-warning/30  text-warning-dark',              label: 'En curso'   },
  pending:     { dot: 'bg-gray-300 dark:bg-gray-600',        chip: 'bg-surface        border-border       text-text-muted dark:bg-gray-800 dark:border-gray-700', label: 'Pendiente'  },
  blocked:     { dot: 'bg-danger-dark',                      chip: 'bg-danger-light   border-danger/30   text-danger-dark',               label: 'Bloqueada'  },
}

const TOOL_STATUS_ORDER: ToolStatus[] = ['in_progress', 'blocked', 'pending', 'complete']

// ── Icons ──────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7l4 4 6-7" />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg className="h-3 w-3 text-navy dark:text-warm-100 ml-0.5" viewBox="0 0 12 12" fill="currentColor">
      <path d="M3 2.5L9.5 6 3 9.5V2.5Z" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg className="h-3.5 w-3.5 text-text-subtle" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2.5" y="6.5" width="9" height="6.5" rx="1.5" />
      <path d="M4.5 6.5V4.5a2.5 2.5 0 015 0v2" />
    </svg>
  )
}

// ── Station node ───────────────────────────────────────────────

function Station({
  phase,
  index,
  selected,
  onClick,
}: {
  phase:    LeanPhase
  index:    number
  selected: boolean
  onClick:  () => void
}) {
  const cfg   = phaseNodeCfg[phase.status]
  const total = phase.tools.length
  const done  = phase.tools.filter((t) => t.status === 'complete').length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0
  const isClickable = phase.status !== 'locked'

  return (
    <div className="flex flex-col items-center gap-2 relative z-10">

      {/* Anillo de pulso — solo en fase activa */}
      {phase.status === 'active' && (
        <div className="absolute top-0 h-10 w-10 rounded-full ring-4 ring-navy/20 dark:ring-info-soft/20 animate-pulse pointer-events-none" />
      )}

      {/* Nodo */}
      <button
        onClick={isClickable ? onClick : undefined}
        disabled={!isClickable}
        aria-pressed={selected}
        aria-label={`Fase ${index + 1}: ${phase.label}`}
        className={[
          'h-10 w-10 rounded-full border-2 flex items-center justify-center',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy dark:focus-visible:ring-info-soft',
          cfg.node,
          isClickable
            ? selected
              ? 'shadow-md scale-110 cursor-pointer'
              : 'hover:scale-105 cursor-pointer'
            : 'cursor-not-allowed opacity-60',
        ].join(' ')}
      >
        {cfg.icon === 'check'  && <IconCheck />}
        {cfg.icon === 'play'   && <IconPlay />}
        {cfg.icon === 'lock'   && <IconLock />}
        {cfg.icon === 'number' && (
          <span className="text-xs font-semibold text-text-subtle">{index + 1}</span>
        )}
      </button>

      {/* Etiqueta + porcentaje */}
      <div className="text-center" style={{ maxWidth: '72px' }}>
        <p className={`text-[11px] leading-tight ${cfg.label}`}>
          {phase.shortLabel ?? phase.label}
        </p>
        {total > 0 && phase.status !== 'locked' && (
          <p className="text-[10px] text-text-subtle mt-0.5">{pct}%</p>
        )}
      </div>

      {/* Flecha indicadora hacia panel inferior */}
      {selected && (
        <div
          aria-hidden="true"
          className="absolute -bottom-[26px] left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white dark:bg-gray-900 border-t border-l border-border dark:border-gray-700 shadow-sm"
        />
      )}
    </div>
  )
}

// ── Tool chip ──────────────────────────────────────────────────

function ToolChip({ tool, onClick }: { tool: PhaseTool; onClick?: () => void }) {
  const cfg = toolCfg[tool.status]
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      title={tool.description ?? tool.name}
      className={[
        'flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-xs w-full',
        'transition-all duration-150',
        cfg.chip,
        onClick
          ? 'hover:shadow-sm hover:-translate-y-0.5 cursor-pointer active:translate-y-0'
          : 'cursor-default',
      ].join(' ')}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      <span className="font-mono font-bold text-[10px] shrink-0 opacity-50">{tool.code}</span>
      <span className="truncate font-medium">{tool.name}</span>
    </button>
  )
}

// ── Phase detail panel ─────────────────────────────────────────

function PhaseDetail({
  phase,
  onToolClick,
}: {
  phase:        LeanPhase
  onToolClick?: (tool: PhaseTool) => void
}) {
  const total = phase.tools.length
  const done  = phase.tools.filter((t) => t.status === 'complete').length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  const grouped = TOOL_STATUS_ORDER.reduce<Record<ToolStatus, PhaseTool[]>>(
    (acc, s) => {
      acc[s] = phase.tools.filter((t) => t.status === s)
      return acc
    },
    { complete: [], in_progress: [], pending: [], blocked: [] }
  )

  const groupLabels: Record<ToolStatus, string> = {
    in_progress: 'En curso',
    blocked:     'Bloqueadas',
    pending:     'Pendientes',
    complete:    'Completadas',
  }

  return (
    <div className="animate-fade-in rounded-xl bg-white dark-card overflow-hidden card-border">

      {/* Header */}
      <div className="flex items-center justify-between gap-6 px-6 py-4 bg-surface dark-card-header card-divider-bottom">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-lean-black dark:text-gray-100">
            {phase.label}
          </h3>
          {phase.description && (
            <p className="text-xs text-text-muted mt-0.5">{phase.description}</p>
          )}
          {phase.duration && (
            <p className="text-[10px] text-text-subtle mt-1 font-mono">{phase.duration}</p>
          )}
        </div>

        {/* Progress */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-xs font-semibold text-lean-black dark:text-gray-100">
            {done}
            <span className="font-normal text-text-muted">/{total} herramientas</span>
          </span>
          <div className="w-36 h-1.5 rounded-full bg-border dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-navy dark:bg-warm-600 transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-text-subtle">{pct}% completado</span>
        </div>
      </div>

      {/* Tools */}
      <div className="px-6 py-5">
        {total === 0 ? (
          <p className="text-xs text-text-subtle text-center py-6">
            Sin herramientas asignadas a esta fase todavía
          </p>
        ) : (
          <div className="space-y-5">
            {TOOL_STATUS_ORDER.map((status) => {
              const items = grouped[status]
              if (items.length === 0) return null
              return (
                <div key={status}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${toolCfg[status].dot}`} />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-subtle">
                      {groupLabels[status]}
                      <span className="ml-1.5 font-normal normal-case tracking-normal text-text-subtle/70">
                        ({items.length})
                      </span>
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {items.map((tool) => (
                      <ToolChip
                        key={tool.code}
                        tool={tool}
                        onClick={onToolClick ? () => onToolClick(tool) : undefined}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── PhaseRoadmap — componente principal ────────────────────────

export function PhaseRoadmap({
  phases,
  className    = '',
  onToolClick,
  readOnly     = false,
}: PhaseRoadmapProps) {
  // Por defecto, la fase activa empieza seleccionada
  const [selectedId, setSelectedId] = useState<string | null>(
    () => phases.find((p) => p.status === 'active')?.id ?? null
  )

  function handleStation(phase: LeanPhase) {
    if (phase.status === 'locked') return
    setSelectedId((prev) => (prev === phase.id ? null : phase.id))
  }

  // Progreso de la línea de metro: cuántos segmentos están completados
  const lastCompleteIdx = phases.reduce<number>(
    (acc, p, i) => (p.status === 'complete' ? i : acc),
    -1
  )
  const totalSegments = phases.length - 1
  const progressPct   = totalSegments > 0
    ? (lastCompleteIdx / totalSegments) * 100
    : 0

  const selectedPhase = phases.find((p) => p.id === selectedId)

  return (
    <div className={`space-y-8 ${className}`}>

      {/* ── Track ── */}
      <div className="relative px-10 pt-2 pb-10">

        {/* Línea de fondo completa — negro puro al 15% */}
        <div
          aria-hidden="true"
          className="absolute left-14 right-14 rounded-full"
          style={{ top: '22px', height: '1px', backgroundColor: 'rgba(0,0,0,0.18)' }}
        />

        {/* Línea de progreso — negro puro sólido */}
        <div
          aria-hidden="true"
          className="absolute left-14 rounded-full transition-all duration-700 ease-out"
          style={{
            top:             '22px',
            height:          '1px',
            backgroundColor: '#000000',
            width:           `calc((100% - 7rem) * ${progressPct / 100})`,
          }}
        />

        {/* Estaciones */}
        <div className="relative flex items-start justify-between">
          {phases.map((phase, index) => (
            <Station
              key={phase.id}
              phase={phase}
              index={index}
              selected={selectedId === phase.id}
              onClick={() => handleStation(phase)}
            />
          ))}
        </div>
      </div>

      {/* ── Panel de detalle ── */}
      {selectedPhase && (
        <PhaseDetail
          phase={selectedPhase}
          onToolClick={
            !readOnly && onToolClick
              ? (tool) => onToolClick(selectedPhase, tool)
              : undefined
          }
        />
      )}
    </div>
  )
}

// ── Skeleton de carga ─────────────────────────────────────────

export function PhaseRoadmapSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="relative px-10 pt-2 pb-10">
        <div className="absolute left-14 right-14 h-0.5 bg-border dark:bg-gray-700 rounded-full" style={{ top: '22px' }} />
        <div className="relative flex items-start justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="h-3 w-14 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border h-40 bg-surface dark:bg-gray-800" />
    </div>
  )
}
