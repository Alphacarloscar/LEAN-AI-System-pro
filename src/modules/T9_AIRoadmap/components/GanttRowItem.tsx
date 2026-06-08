// ============================================================
// T9 — GanttRowItem
//
// Fila individual del Gantt de T9. Renderiza tanto filas AI
// (importadas de T4) como filas libres del consultor.
// ============================================================

import type { ReactNode } from 'react'
import { Badge }          from '@shared/design-system/components'
import type { AIActRiskLevel, UseCase } from '@/modules/T4_UseCasePriorityBoard/types'
import type { FreeItem, FreeItemStatus, RoadmapRiskLevel, T9ItemOverride } from '../types'

// ── Tipos de fila ─────────────────────────────────────────────

export type AIGanttRow   = { kind: 'ai';   uc: UseCase; override: T9ItemOverride }
export type FreeGanttRow = { kind: 'free'; item: FreeItem }
export type GanttRow     = AIGanttRow | FreeGanttRow

// ── Design System tokens ──────────────────────────────────────

export const DS = {
  navy:           '#2A2822',
  successLight:   '#D4EDE3',
  successDark:    '#5FAF8A',
  warningLight:   '#FAF0D7',
  warningDark:    '#D4A85C',
  dangerLight:    '#F5DEDE',
  dangerDark:     '#C06060',
  infoLight:      '#DDE8F5',
  infoDark:       '#6A90C0',
  surface:        '#F7F4EE',
  textMuted:      '#6B6864',
  freeBarPending: '#D4D0C8',
  freeBar:        '#B4B0A8',
  freeBarText:    '#2C2A26',
  freeSourceColor:'#444441',
} as const

// ── Helpers de riesgo ─────────────────────────────────────────

export function mapAIActRisk(r?: AIActRiskLevel): RoadmapRiskLevel {
  if (!r || r === 'minimo' || r === 'sin_clasificar') return 'bajo'
  if (r === 'limitado') return 'medio'
  return 'alto'
}

export const RISK_META: Record<RoadmapRiskLevel, { label: string; bg: string; color: string }> = {
  alto:  { label: 'Riesgo alto',  bg: DS.dangerLight,  color: DS.dangerDark  },
  medio: { label: 'Riesgo medio', bg: DS.warningLight, color: DS.warningDark },
  bajo:  { label: 'Riesgo bajo',  bg: DS.successLight, color: DS.successDark },
}

const T4_STATUS_META = {
  go:         { label: 'Aprobado',   bg: DS.successLight, color: DS.successDark },
  en_piloto:  { label: 'En piloto',  bg: DS.infoLight,    color: DS.infoDark   },
  completado: { label: 'Completado', bg: DS.successLight, color: DS.successDark },
  priorizado: { label: 'Priorizado', bg: DS.warningLight, color: DS.warningDark },
  candidato:  { label: 'Candidato',  bg: DS.surface,      color: DS.textMuted  },
  no_go:      { label: 'No Go',      bg: DS.dangerLight,  color: DS.dangerDark  },
} as const

const FREE_STATUS_META: Record<FreeItemStatus, { label: string; bg: string; color: string }> = {
  pendiente:  { label: 'Pendiente',  bg: DS.surface,      color: DS.textMuted  },
  en_curso:   { label: 'En curso',   bg: DS.infoLight,    color: DS.infoDark   },
  completado: { label: 'Completado', bg: DS.successLight, color: DS.successDark },
}

// ── Helpers de posición ───────────────────────────────────────

export function barLeftPct(startMonth: number): string {
  return `${(startMonth / 12) * 100}%`
}

export function barWidthPct(startMonth: number, endMonth: number): string {
  return `${Math.max(((endMonth - startMonth + 1) / 12) * 100, 4)}%`
}

export function milestoneLeftPct(endMonth: number): string {
  return `calc(${((endMonth + 1) / 12) * 100}% - 5px)`
}

// ── Props ─────────────────────────────────────────────────────

interface GanttRowProps {
  row:           GanttRow
  isEditing:     boolean
  editValue:     string
  onEditStart:   (current: string) => void
  onEditChange:  (v: string) => void
  onEditSave:    () => void
}

// ── Componente ────────────────────────────────────────────────

export function GanttRowItem({
  row, isEditing, editValue, onEditStart, onEditChange, onEditSave,
}: GanttRowProps) {

  let name:          string
  let department:    string
  let responsible:   string
  let startMonth:    number
  let endMonth:      number
  let riskMeta:      { label: string; bg: string; color: string }
  let statusBadge:   ReactNode
  let barBg:         string
  let barTextColor:  string
  let barOpacity:    number
  let showMilestone: boolean
  let sourceLabel:   string
  let sourceBg:      string
  let sourceColor:   string

  if (row.kind === 'ai') {
    const { uc, override } = row
    name          = uc.name
    department    = uc.department
    responsible   = override.responsible
    startMonth    = override.startMonth
    endMonth      = override.endMonth
    riskMeta      = RISK_META[mapAIActRisk(uc.aiActClassification?.riskLevel)]
    const sm      = T4_STATUS_META[uc.status] ?? T4_STATUS_META.candidato
    statusBadge   = <Badge shape="pill" size="xs" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</Badge>
    barBg         = DS.navy
    barTextColor  = '#ffffff'
    barOpacity    = uc.status === 'completado' ? 0.45 : 1
    showMilestone = !!uc.roadmap?.quarter
    sourceLabel   = 'T4 · Go'
    sourceBg      = DS.infoLight
    sourceColor   = DS.infoDark
  } else {
    const { item } = row
    name          = item.name
    department    = item.department
    responsible   = item.responsible
    startMonth    = item.startMonth
    endMonth      = item.endMonth
    riskMeta      = RISK_META[item.riskLevel]
    const sm      = FREE_STATUS_META[item.status]
    statusBadge   = <Badge shape="pill" size="xs" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</Badge>
    barBg         = item.status === 'pendiente' ? DS.freeBarPending : DS.freeBar
    barTextColor  = DS.freeBarText
    barOpacity    = item.status === 'completado' ? 0.5 : 1
    showMilestone = false
    sourceLabel   = 'Libre'
    sourceBg      = DS.surface
    sourceColor   = DS.freeSourceColor
  }

  return (
    <div
      className="grid border-t border-border dark:border-white/6 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
      style={{ gridTemplateColumns: '260px 1fr', minHeight: 56 }}
    >
      {/* Columna izquierda: info */}
      <div className="px-4 py-2 flex flex-col justify-center gap-1 border-r border-border dark:border-white/6 min-w-0">
        <p
          className="text-xs font-medium text-lean-black dark:text-warm-50 truncate"
          style={{ maxWidth: 228 }}
          title={name}
        >
          {name}
        </p>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge shape="pill" size="xs" style={{ backgroundColor: sourceBg, color: sourceColor }}>{sourceLabel}</Badge>
          {statusBadge}
          <Badge shape="pill" size="xs" style={{ backgroundColor: riskMeta.bg, color: riskMeta.color }}>{riskMeta.label}</Badge>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="default" shape="pill" size="xs" className="shrink-0">
            {department || '—'}
          </Badge>

          {isEditing ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              onBlur={onEditSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter')  onEditSave()
                if (e.key === 'Escape') onEditSave()
              }}
              className="text-[10px] border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5 bg-white dark:bg-gray-800 text-text-muted w-28 outline-none focus:ring-1 focus:ring-blue-300"
            />
          ) : (
            <button
              onClick={() => onEditStart(responsible)}
              className="flex items-center gap-0.5 text-[10px] text-text-muted hover:text-lean-black dark:hover:text-gray-100 transition-colors group"
            >
              <span>{responsible || '— sin responsable'}</span>
              <svg
                className="opacity-0 group-hover:opacity-50 ml-0.5 flex-shrink-0"
                width="9" height="9" viewBox="0 0 12 12" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M8.5 1.5l2 2L4 10H2V8L8.5 1.5z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Columna derecha: barra Gantt */}
      <div className="relative flex items-center px-2 overflow-hidden">

        {/* Líneas de mes */}
        <div
          className="absolute inset-0 grid pointer-events-none"
          style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={i < 11 ? 'border-r border-border/25 dark:border-white/5' : ''}
            />
          ))}
        </div>

        {/* Separadores de trimestre */}
        {[25, 50, 75].map((pct) => (
          <div
            key={pct}
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: `${pct}%`, width: 1, background: 'rgba(0,0,0,0.10)' }}
          />
        ))}

        {/* Barra */}
        <div
          className="absolute h-[22px] rounded flex items-center px-2 overflow-hidden"
          style={{
            left:       barLeftPct(startMonth),
            width:      barWidthPct(startMonth, endMonth),
            background: barBg,
            opacity:    barOpacity,
            transition: 'opacity 200ms',
          }}
        >
          <span className="text-[10px] font-medium truncate" style={{ color: barTextColor }}>
            {name}
          </span>
        </div>

        {/* Hito al final de la barra */}
        {showMilestone && (
          <div
            className="absolute w-2.5 h-2.5 rounded-full z-10 pointer-events-none"
            style={{
              left:      milestoneLeftPct(endMonth),
              top:       '50%',
              transform: 'translateY(-50%)',
              background: DS.dangerDark,
            }}
          />
        )}
      </div>
    </div>
  )
}
