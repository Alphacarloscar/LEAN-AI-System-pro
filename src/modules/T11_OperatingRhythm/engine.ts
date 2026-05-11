// ============================================================
// T11 — Motor de recomendación
//
// Deriva el modelo operativo completo a partir de:
//   - scenario.t1Radar → madurez IA → tier
//   - scenario.company → perfil empresa
//   - T6 store (opcional) → enriquece riesgos
//   - T12 store (opcional) → enriquece compliance
// ============================================================

import type { RadarDimension }   from '@/shared/components/charts/LeanRadarChart'
import type { T11MaturityTier, T11AdaptiveMode, T11OperatingModel } from './types'
import {
  T11_EVENTS_CATALOG,
  T11_DECISIONS,
  T11_PHASE_OBJECTIVES,
  T11_KPI_GROUPS,
} from './constants'

// ── Helpers ───────────────────────────────────────────────────

/** Calcula el promedio del radar T1 → score 0-4 */
export function calcMaturityAvg(radar: RadarDimension[]): number {
  if (!radar.length) return 0
  const sum = radar.reduce((acc, d) => acc + (d.current ?? 0), 0)
  return Math.round((sum / radar.length) * 100) / 100
}

/** Clasifica el score en un tier de madurez */
export function scoreToTier(avg: number): T11MaturityTier {
  if (avg < 1.5) return 'foundational'
  if (avg < 2.5) return 'developing'
  if (avg < 3.5) return 'advanced'
  return 'optimised'
}

const TIER_ORDER: Record<T11MaturityTier, number> = {
  foundational: 0,
  developing:   1,
  advanced:     2,
  optimised:    3,
}

/**
 * Clasifica el score en un modo adaptativo de cadencia.
 *
 * basic    (avg < 2)  → solo ceremonias esenciales (isCritical)
 * standard (2 ≤ avg ≤ 3) → filtrado estándar por tier
 * full     (avg > 3)  → catálogo SAFe completo
 */
export function getAdaptiveMode(avg: number): T11AdaptiveMode {
  if (avg < 2) return 'basic'
  if (avg > 3) return 'full'
  return 'standard'
}

/**
 * Filtra eventos del catálogo aplicando dos capas:
 *   1. Filtro por tier (minTier ≤ tier actual)
 *   2. Filtro adaptativo por avg de madurez
 */
export function getRecommendedEvents(tier: T11MaturityTier, avg: number) {
  const byTier = T11_EVENTS_CATALOG.filter(
    (e) => TIER_ORDER[e.minTier] <= TIER_ORDER[tier]
  )

  if (avg < 2) {
    // Modo básico: solo ceremonias esenciales dentro del tier
    return byTier.filter((e) => e.isCritical)
  }
  if (avg > 3) {
    // Modo SAFe completo: todos los eventos del catálogo
    return [...T11_EVENTS_CATALOG]
  }
  // Modo estándar: filtrado por tier
  return byTier
}

// ── Función principal ─────────────────────────────────────────

export interface EngineInput {
  radar:    RadarDimension[]
  employees: number
}

export function buildOperatingModel(input: EngineInput): T11OperatingModel {
  const { radar } = input

  const avg          = calcMaturityAvg(radar)
  const tier         = scoreToTier(avg)
  const adaptiveMode = getAdaptiveMode(avg)
  const events       = getRecommendedEvents(tier, avg)

  return {
    maturityTier:      tier,
    maturityAvg:       avg,
    adaptiveMode,
    recommendedEvents: events,
    decisions:         T11_DECISIONS,
    phaseObjectives:   T11_PHASE_OBJECTIVES,
    kpiGroups:         T11_KPI_GROUPS,
  }
}
