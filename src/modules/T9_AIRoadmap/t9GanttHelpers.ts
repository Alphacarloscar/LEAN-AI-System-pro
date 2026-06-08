// ============================================================
// T9 — Gantt helpers
//
// Funciones puras para calcular posición y duración de barras
// del Gantt, usadas por T9View y GanttRowItem.
// ============================================================

import type { UseCase }       from '@/modules/T4_UseCasePriorityBoard/types'
import type { T9ItemOverride } from './types'

export const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] as const

export function quarterToStartMonth(quarter?: string): number {
  if (!quarter) return 0
  const q = quarter.toUpperCase()
  if (q.includes('Q1')) return 0
  if (q.includes('Q2')) return 3
  if (q.includes('Q3')) return 6
  if (q.includes('Q4')) return 9
  return 0
}

export function durationToSpan(duration?: string): number {
  if (!duration) return 1
  const lower = duration.toLowerCase()
  if (lower.includes('semana')) {
    return Math.max(1, Math.ceil((parseInt(lower, 10) || 2) / 4))
  }
  if (lower.includes('mes')) {
    return Math.max(1, parseInt(lower, 10) || 1)
  }
  return 1
}

export function computeDefaultOverride(uc: UseCase): T9ItemOverride {
  const responsible = uc.roadmap?.owner ?? uc.sponsorName ?? '—'

  // Prioridad: fechas explícitas (startDate/endDate) > quarter + duración estimada
  if (uc.roadmap?.startDate) {
    // Append T12:00:00 to avoid UTC-midnight timezone boundary issue (UTC+1/+2 shifts month)
    const startD = new Date(uc.roadmap.startDate + 'T12:00:00')
    // NaN guard: si la fecha es malformada, caer al branch quarter/duración
    if (!isNaN(startD.getTime())) {
      const startMonth = startD.getMonth()
      const endD       = uc.roadmap?.endDate
        ? new Date(uc.roadmap.endDate + 'T12:00:00')
        : null
      const endMonth   = (endD && !isNaN(endD.getTime()))
        ? endD.getMonth()
        : Math.min(startMonth + durationToSpan(uc.roadmap?.estimatedDuration) - 1, 11)
      return {
        useCaseId:   uc.id,
        startMonth,
        endMonth:    Math.min(Math.max(endMonth, startMonth), 11),
        responsible,
      }
    }
  }

  const start = quarterToStartMonth(uc.roadmap?.quarter)
  const span  = durationToSpan(uc.roadmap?.estimatedDuration)
  return {
    useCaseId:   uc.id,
    startMonth:  start,
    endMonth:    Math.min(start + span - 1, 11),
    responsible,
  }
}
