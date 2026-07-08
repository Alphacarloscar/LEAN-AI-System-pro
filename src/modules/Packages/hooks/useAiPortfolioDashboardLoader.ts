// ============================================================
// Packages — useAiPortfolioDashboardLoader.ts  (FDR-002, B3)
//
// Hook LOADER del dashboard ai-portfolio. Responsabilidad ÚNICA:
// orquestar la hidratación de los stores de forma SECUENCIAL y
// exponer en qué fase va cada fuente (loadPhase).
//
// Convergencia con auditor GPT (B3) — "B híbrida":
//   1. cache-first: si el store ya está fresco, ensureLoaded hace skip
//      (dedup + stale-guard de cada store) → coste casi cero.
//   2. carga SECUENCIAL (no paralela): evita el burst de 5 fetch que
//      desactivó ProjectRuntimeProvider (ENABLE_PROJECT_RUNTIME_GLOBAL_LOAD=false).
//   3. render progresivo: cada fuente publica 'loading' → 'settled'; el
//      adaptador read-only usa eso para que una card fría sea 'loading',
//      nunca 'empty' (regla de oro: frío ≠ vacío).
//
// Orden de carga (GPT, por impacto comercial del hero):
//   CompanyProfile → T4 → T3 → T5 → T1
//   (contexto ejecutivo → núcleo de casos → procesos → taxonomía →
//    diagnóstico; T1 último porque solo alimenta la derivada T11).
//
// Contrato de fallo: si una fuente falla, NO se aborta la cadena; se
// marca 'settled' igual y se sigue con la siguiente. La card refleja el
// error vía el loadError de su propio store (read-only, sin bloquear).
//
// ADR-010: errores operativos vía reportError, nunca console.error.
// ADR-011: no toca Supabase; solo dispara ensureLoaded de stores.
// ============================================================

import { useEffect, useState } from 'react'

import { useT1Store }             from '@/modules/T1_MaturityRadar/store'
import { useT3Store }             from '@/modules/T3_ValueStreamMap/store'
import { useT4Store }             from '@/modules/T4_UseCasePriorityBoard/store'
import { useT5Store }             from '@/modules/T5_AITaxonomyCanvas/store'
import { useCompanyProfileStore } from '@/modules/CompanyProfile/store'
import { reportError }            from '@/lib/reportError'

// ── Tipos ─────────────────────────────────────────────────────

/** Fuentes cargables del dashboard ai-portfolio. T9/T11 son derivadas:
 *  no se cargan, dependen de estas (T9←T4, T11←T1+companyProfile). */
export type PortfolioLoadSource = 'companyProfile' | 'T4' | 'T3' | 'T5' | 'T1'

export type LoadPhase = 'pending' | 'loading' | 'settled'

export type PortfolioLoadPhases = Record<PortfolioLoadSource, LoadPhase>

const INITIAL_PHASES: PortfolioLoadPhases = {
  companyProfile: 'pending',
  T4:             'pending',
  T3:             'pending',
  T5:             'pending',
  T1:             'pending',
}

const REASON = 'package_dashboard_mount'

// ── Hook ──────────────────────────────────────────────────────

/**
 * Dispara la carga secuencial al montar (o al cambiar de projectId) y
 * devuelve la fase de cada fuente. El adaptador read-only la consume
 * para derivar `settled` por card.
 */
export function useAiPortfolioDashboardLoader(projectId: string | null): PortfolioLoadPhases {
  const [phases, setPhases] = useState<PortfolioLoadPhases>(INITIAL_PHASES)

  useEffect(() => {
    if (!projectId) {
      setPhases(INITIAL_PHASES)
      return
    }

    let cancelled = false

    // Cada paso usa el entry point nativo del store (todos exponen ya
    // ensureLoaded tras FDR-002 B3) con dedup + stale-guard internos.
    const steps: Array<[PortfolioLoadSource, () => Promise<void>]> = [
      ['companyProfile', () => useCompanyProfileStore.getState().ensureLoaded(projectId, { reason: REASON })],
      ['T4',             () => useT4Store.getState().ensureLoaded(projectId, { reason: REASON })],
      ['T3',             () => useT3Store.getState().ensureLoaded(projectId, { reason: REASON })],
      ['T5',             () => useT5Store.getState().ensureLoaded(projectId, { reason: REASON })],
      ['T1',             () => useT1Store.getState().ensureLoaded(projectId, { reason: REASON })],
    ]

    setPhases(INITIAL_PHASES)

    const run = async () => {
      for (const [source, load] of steps) {
        if (cancelled) return
        setPhases((p) => ({ ...p, [source]: 'loading' }))
        try {
          await load()
        } catch (err) {
          // ensureLoaded normalmente captura su propio error y lo deja en el
          // store; este catch es defensivo para no romper la cadena.
          reportError(`[aiPortfolioLoader] ${source}`, err)
        }
        if (cancelled) return
        setPhases((p) => ({ ...p, [source]: 'settled' }))
      }
    }

    void run()
    return () => { cancelled = true }
  }, [projectId])

  return phases
}
