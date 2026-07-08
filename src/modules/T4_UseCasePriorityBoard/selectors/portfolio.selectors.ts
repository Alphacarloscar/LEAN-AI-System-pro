// ============================================================
// T4 — portfolio.selectors.ts  (FDR-002 · ownership de métricas)
//
// Selectores PUROS propietarios de T4. Bajo el Veredicto A
// (frontera dura): las métricas de negocio del portfolio IA viven
// AQUÍ, en el módulo dueño del dato (UseCase[]), no en la capa
// `Packages` ni inline en la vista T10.
//
// Consumidores:
//   — T10_AIValueDashboard (P2 Portfolio) → selectT4PortfolioMetrics
//   — Packages/AiPortfolioDashboard       → selectT4PortfolioMetrics
//   — Packages (conteo GO) / T9 (derivada) → selectGoUseCases / Count
//
// IMPORTANTE (contrato de invariancia de render):
//   selectT4PortfolioMetrics reproduce EXACTAMENTE la lógica que
//   T10View computaba inline en su useMemo `liveT4`. Misma fórmula,
//   mismos redondeos, misma forma de salida. No "mejorar" aquí:
//   cualquier cambio de fórmula alteraría los números que T10 ya
//   enseña en producción → decisión de producto aparte (ver
//   docs/architecture/TECH-DEBT.md, divergencia con
//   computeROIFromEconomics per-caso).
//
// Puro: sin hooks, sin Zustand, sin Supabase. Testeable sin React.
// ============================================================

import type { UseCase, T4PortfolioMetrics } from '../types'

// ── Portfolio agregado (métrica hero de la card T4) ───────────

/**
 * Métricas agregadas del portfolio de casos de uso IA.
 * Copia byte-a-byte de la lógica de T10View.liveT4 (invariancia de render).
 */
export function selectT4PortfolioMetrics(useCases: UseCase[]): T4PortfolioMetrics {
  if (useCases.length === 0) return {
    totalInitiatives: 0, estimatedValue: 0, totalInvestment: 0, ahorroAnual: 0,
    paybackMeses: 0, roi3years: 0, roi: 0,
    statuses: { active: 0, validating: 0, backlog: 0, stopped: 0 },
    topInitiatives: [],
  }

  const active     = useCases.filter(uc => ['go', 'en_piloto', 'completado'].includes(uc.status)).length
  const validating = useCases.filter(uc => uc.status === 'priorizado').length
  const backlog    = useCases.filter(uc => uc.status === 'candidato').length
  const stopped    = useCases.filter(uc => uc.status === 'no_go').length

  const ucWithEco  = useCases.filter(uc => uc.economics)
  const totalInvestment = ucWithEco.reduce((s, uc) => s + (uc.economics?.implementationCost ?? 0), 0)
  const savings = ucWithEco.map(uc => { const e = uc.economics!; return e.processHoursPerWeek * e.headcount * 52 * e.efficiencyGain * e.hourlyRate })
  const totalSaving = savings.reduce((a, b) => a + b, 0)
  const paybacks  = ucWithEco.map((uc, i) => { const s = savings[i]; const c = uc.economics?.implementationCost ?? 0; return s > 0 && c > 0 ? (c / s) * 12 : null }).filter((p): p is number => p !== null)
  const roi3List  = ucWithEco.map((uc, i) => { const s = savings[i]; const c = uc.economics?.implementationCost ?? 0; return s > 0 && c > 0 ? ((s * 3 - c) / c) * 100 : null }).filter((r): r is number => r !== null)
  const topInitiatives = [...useCases].filter(uc => ['go', 'en_piloto', 'priorizado'].includes(uc.status)).sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 3).map(uc => ({ name: uc.name, status: ['go', 'en_piloto'].includes(uc.status) ? 'active' : 'validating', value: uc.economics?.implementationCost ?? 0 }))

  return {
    totalInitiatives: useCases.length, estimatedValue: 0, totalInvestment, ahorroAnual: totalSaving,
    paybackMeses: paybacks.length ? Math.round(paybacks.reduce((a, b) => a + b, 0) / paybacks.length) : 0,
    roi3years: roi3List.length ? Math.round(roi3List.reduce((a, b) => a + b, 0) / roi3List.length) : 0,
    roi: totalInvestment > 0 ? Math.round((totalSaving * 3 / totalInvestment) * 10) / 10 : 0,
    statuses: { active, validating, backlog, stopped }, topInitiatives,
  }
}

// ── Casos GO (señal atómica, sin arrastrar ROI/inversión) ─────
//
// Separada del portfolio completo a propósito (convergencia GPT):
// T9 (roadmap) necesita "casos GO" sin cargar el resto de métricas.

/** Casos de uso aprobados para implementar (status === 'go'). */
export function selectGoUseCases(useCases: UseCase[]): UseCase[] {
  return useCases.filter(uc => uc.status === 'go')
}

/** Conteo de casos GO. Consumido por Packages/AiPortfolioDashboard. */
export function selectGoUseCaseCount(useCases: UseCase[]): number {
  return selectGoUseCases(useCases).length
}
