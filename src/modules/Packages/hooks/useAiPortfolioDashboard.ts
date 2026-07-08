// ============================================================
// Packages — useAiPortfolioDashboard.ts  (FDR-002, B3)
//
// Hook ADAPTADOR read-only del dashboard ai-portfolio. Es el ÚNICO
// punto que lee stores ajenos (T3,T4,T5,T9,T1,CompanyProfile) y los
// traduce, vía selectores puros, en el modelo que el componente
// renderiza. NO carga datos — eso es responsabilidad del loader
// (useAiPortfolioDashboardLoader). Aquí solo se lee y se deriva.
//
// Convergencia con auditor GPT (B3): separación de responsabilidades.
//   loader  → orquesta ensureLoaded secuencial + expone loadPhase.
//   adapter → lee stores + deriva estados de presentación (este hook).
// El acoplamiento "leer varios stores" se concentra aquí, nunca en el
// JSX ni en las tarjetas. La lógica vive en *.selectors.ts (puro).
//
// Regla de oro (frío ≠ vacío): el adaptador convierte loadPhase en un
// booleano `settled` por card y lo pasa al selector; mientras una fuente
// no esté 'settled', su card es 'loading', no 'empty'.
//
// ADR-011: no toca Supabase. Solo lee estado ya hidratado de stores.
// ============================================================

import { useT1Store }             from '@/modules/T1_MaturityRadar/store'
import { useT3Store }             from '@/modules/T3_ValueStreamMap/store'
import { useT4Store }             from '@/modules/T4_UseCasePriorityBoard/store'
import { useT5Store }             from '@/modules/T5_AITaxonomyCanvas/store'
import { useT9Store }             from '@/modules/T9_AIRoadmap/store'
import { useCompanyProfileStore } from '@/modules/CompanyProfile/store'

import {
  selectT3Card,
  selectT4Card,
  selectT5Card,
  selectT9Card,
  selectT11Card,
  selectPortfolioGlobal,
  type PortfolioDashboardModel,
} from '@/modules/Packages/selectors/aiPortfolioDashboard.selectors'

import type { PortfolioLoadPhases } from './useAiPortfolioDashboardLoader'

export function useAiPortfolioDashboard(phases: PortfolioLoadPhases): PortfolioDashboardModel {
  // T3 — independiente
  const t3Processes = useT3Store((s) => s.processes)
  const t3HasData   = useT3Store((s) => s.hasData)
  const t3Error     = useT3Store((s) => s.loadError)

  // T4 — independiente (corazón del paquete; alimenta también a T9)
  const t4UseCases  = useT4Store((s) => s.useCases)
  const t4LoadError = useT4Store((s) => s.loadError)

  // T5 — independiente. Señal de persistencia: canvas.id !== ''
  const t5CanvasId = useT5Store((s) => s.canvas.id)
  const t5Error    = useT5Store((s) => s.loadError)

  // T9 — derivada (freeItems propios + casos GO de T4)
  const t9FreeItems = useT9Store((s) => s.freeItems)

  // T11 — derivada de T1 (hasData) + CompanyProfile (savedAt !== null)
  const t1HasData    = useT1Store((s) => s.hasData)
  const t1LoadError  = useT1Store((s) => s.loadError)
  const profileSaved = useCompanyProfileStore((s) => s.profile.savedAt !== null)

  const t4GoCount = t4UseCases.filter((uc) => uc.status === 'go').length

  // settled por card desde loadPhase. Derivadas heredan el settled de su fuente.
  const t3Settled  = phases.T3 === 'settled'
  const t4Settled  = phases.T4 === 'settled'
  const t5Settled  = phases.T5 === 'settled'
  const t9Settled  = phases.T4 === 'settled'                                       // T9 ← T4
  const t11Settled = phases.T1 === 'settled' && phases.companyProfile === 'settled' // T11 ← T1 + perfil

  const cards = [
    selectT3Card({ processes: t3Processes, hasData: t3HasData, loadError: t3Error, settled: t3Settled }),
    selectT4Card({ useCases: t4UseCases, loadError: t4LoadError, settled: t4Settled }),
    selectT5Card({ canvasId: t5CanvasId, loadError: t5Error, settled: t5Settled }),
    selectT9Card({ t4GoCount, freeItems: t9FreeItems, t4Error: t4LoadError !== null, settled: t9Settled }),
    selectT11Card({ t1HasData, t1Error: t1LoadError !== null, profileSaved, settled: t11Settled }),
  ]

  const { status, summary } = selectPortfolioGlobal(cards)
  return { cards, globalStatus: status, summary }
}
