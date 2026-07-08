// ============================================================
// T4 — aiActRisk.selectors.ts  (FDR-002, Bloque 3)
//
// Home canónico del resumen de riesgo AI Act (decisión auditor GPT,
// B3): la métrica deriva EXCLUSIVAMENTE de useCases de T4, aunque hoy
// se visualice en una tab de T6. Ubicarla aquí evita la dependencia
// conceptual invertida (T6 aparentando ser dueño de un dato de T4).
//
// Función PURA (no hook, no store): consumible por RiskDashboardTab
// (T6), por el dashboard de paquete ai-compliance y por tests, sin
// acoplarse al hook de Zustand. Cada consumidor obtiene `useCases`
// como prefiera y memoiza por su cuenta.
//
// EXTRACCIÓN FIEL: la lógica es copia literal del useMemo inline que
// vivía en RiskDashboardTab.tsx (campo aiActClassification?.riskLevel
// ?? 'sin_clasificar', mismo ALL_RISK_LEVELS, mismo redondeo, mismo
// caso vacío). NO se cambia comportamiento — solo se centraliza.
// ============================================================

import type { AIActRiskLevel, UseCase } from '@/modules/T4_UseCasePriorityBoard/types'

/** Universo único de niveles AI Act (incluye 'sin_clasificar' como nivel real). */
export const ALL_RISK_LEVELS: AIActRiskLevel[] = [
  'prohibido',
  'alto',
  'limitado',
  'minimo',
  'sin_clasificar',
]

/** Resumen agregado de clasificación AI Act sobre los casos de uso (read-only). */
export interface AIActRiskSummary {
  total:           number
  byLevel:         Record<AIActRiskLevel, number>
  classified:      number
  unclassified:    number
  /** % de casos clasificados (entero, redondeado). */
  coveragePercent: number
}

/**
 * Agregación read-only del riesgo AI Act a partir de los casos de uso de T4.
 * Sin información nueva: cuenta campos ya persistidos por T4.
 */
export function selectAIActRiskSummaryFromUseCases(useCases: UseCase[]): AIActRiskSummary {
  const byLevel = ALL_RISK_LEVELS.reduce(
    (acc, l) => ({ ...acc, [l]: 0 }),
    {} as Record<AIActRiskLevel, number>,
  )
  let classified = 0
  useCases.forEach((uc) => {
    const level = uc.aiActClassification?.riskLevel ?? 'sin_clasificar'
    byLevel[level]++
    if (uc.aiActClassification) classified++
  })
  return {
    total:           useCases.length,
    byLevel,
    classified,
    unclassified:    useCases.length - classified,
    coveragePercent: useCases.length > 0 ? Math.round((classified / useCases.length) * 100) : 0,
  }
}
