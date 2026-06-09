import type { AIActRiskLevel } from '@/modules/T4_UseCasePriorityBoard/types'
import type { RoadmapRiskLevel, FreeItemStatus } from '../types'

// ── Tipos de fila ─────────────────────────────────────────────

import type { UseCase } from '@/modules/T4_UseCasePriorityBoard/types'
import type { FreeItem, T9ItemOverride } from '../types'

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

// ── Status meta helpers ───────────────────────────────────────

export const T4_STATUS_META = {
  go:         { label: 'Aprobado',   bg: DS.successLight, color: DS.successDark },
  en_piloto:  { label: 'En piloto',  bg: DS.infoLight,    color: DS.infoDark   },
  completado: { label: 'Completado', bg: DS.successLight, color: DS.successDark },
  priorizado: { label: 'Priorizado', bg: DS.warningLight, color: DS.warningDark },
  candidato:  { label: 'Candidato',  bg: DS.surface,      color: DS.textMuted  },
  no_go:      { label: 'No Go',      bg: DS.dangerLight,  color: DS.dangerDark  },
} as const

export const FREE_STATUS_META: Record<FreeItemStatus, { label: string; bg: string; color: string }> = {
  pendiente:  { label: 'Pendiente',  bg: DS.surface,      color: DS.textMuted  },
  en_curso:   { label: 'En curso',   bg: DS.infoLight,    color: DS.infoDark   },
  completado: { label: 'Completado', bg: DS.successLight, color: DS.successDark },
}
