// ============================================================
// Packages — aiPortfolioDashboard.selectors.ts  (FDR-002, B3)
//
// Selectores PUROS (sin hooks, sin Zustand) que derivan el estado
// read-only de cada tarjeta del dashboard ai-portfolio (T3,T4,T5 +
// derivadas T9,T11) y el estado global del paquete.
//
// Por qué puros (convergencia con auditor GPT, B3):
//   — Testeables sin montar React ni stores.
//   — El acoplamiento "leer varios stores" vive SOLO en el hook
//     adaptador (useAiPortfolioDashboard), nunca en una tarjeta ni
//     en el JSX. Cada tarjeta recibe datos planos, no conoce stores.
//   — Read-only: cuentan campos ya persistidos, no calculan métricas
//     nuevas (regla B3 de Carlos).
//
// REGLA DE ORO (convergencia con GPT, contrato de carga B3):
//   Un store frío ANTES de que su carga termine NO es 'empty' — es
//   'loading'. 'empty' solo puede aparecer tras: carga resuelta
//   (settled=true) + sin datos + sin error. Por eso cada selector
//   recibe `settled` (lo provee el loader vía loadPhase) y, si es
//   false, devuelve 'loading' sin importar que los datos estén vacíos.
//   Esto evita el "falso vacío" que mataría el momento comercial.
//
// SEÑAL DE ERROR (real, no inferida):
//   T3/T5/T4 exponen loadError en su store (T4 lo gana en FDR-002 B3).
//   Las derivadas heredan el error de su fuente: T9 ← T4, T11 ← T1.
// ============================================================

import type { ToolCode }    from '@/types'
import type { ValueStream } from '@/modules/T3_ValueStreamMap/types'
import type { UseCase }     from '@/modules/T4_UseCasePriorityBoard/types'
import type { FreeItem }    from '@/modules/T9_AIRoadmap/types'
import { selectGoUseCaseCount } from '@/modules/T4_UseCasePriorityBoard/selectors/portfolio.selectors'

// ── Tipos de salida ───────────────────────────────────────────

export type ToolCardStatus =
  | 'loaded'   // hay datos reales
  | 'empty'    // cargado (settled) pero sin datos
  | 'loading'  // aún sin resolver (frío o en vuelo)
  | 'error'    // error de carga

export interface ToolCardState {
  code:   ToolCode
  status: ToolCardStatus
  /** Texto read-only resumido (ej. "8 casos · 3 priorizados"). null si no aplica. */
  metric: string | null
  /** Contexto/razón del estado (ej. "Sin procesos mapeados"). null si no aplica. */
  note:   string | null
}

export type PortfolioGlobalStatus =
  | 'complete'  // todas resueltas con datos
  | 'partial'   // alguna con datos y alguna vacía/cargando
  | 'empty'     // todas resueltas, ninguna con datos
  | 'loading'   // nada resuelto con datos todavía
  | 'error'     // alguna en error

export interface PortfolioDashboardModel {
  cards:        ToolCardState[]
  globalStatus: PortfolioGlobalStatus
  /** Resumen de 1 línea para la cabecera del dashboard. */
  summary:      string
}

// ── Helpers internos ──────────────────────────────────────────

function card(code: ToolCode, status: ToolCardStatus, metric: string | null, note: string | null): ToolCardState {
  return { code, status, metric, note }
}
const plural = (n: number) => (n === 1 ? '' : 's')

// ── Selectores por tarjeta (independientes) ───────────────────

/** T3 — Value Stream Map. Señales reales: hasData, loadError, settled. */
export function selectT3Card(i: {
  processes: ValueStream[]; hasData: boolean; loadError: string | null; settled: boolean
}): ToolCardState {
  if (i.loadError && !i.hasData)              return card('T3', 'error',   null, i.loadError)
  if (!i.settled)                             return card('T3', 'loading', null, null)
  if (!i.hasData || i.processes.length === 0) return card('T3', 'empty',   null, 'Sin procesos mapeados')
  return card('T3', 'loaded', `${i.processes.length} proceso${plural(i.processes.length)}`, null)
}

/** T4 — Use Case Priority Board. Gana loadError en FDR-002 B3. */
export function selectT4Card(i: {
  useCases: UseCase[]; loadError: string | null; settled: boolean
}): ToolCardState {
  if (i.loadError)             return card('T4', 'error',   null, i.loadError === 'timeout' ? 'Tiempo de carga agotado' : 'Error de carga')
  if (!i.settled)              return card('T4', 'loading', null, null)
  if (i.useCases.length === 0) return card('T4', 'empty',   null, 'Sin casos de uso')
  const go = selectGoUseCaseCount(i.useCases)  // selector propietario de T4 (Veredicto A)
  return card('T4', 'loaded', `${i.useCases.length} caso${plural(i.useCases.length)} · ${go} priorizado${plural(go)}`, null)
}

/**
 * T5 — AI Taxonomy Canvas. Señal de persistencia: canvas.id !== '' (un canvas
 * persistido trae id real; el default buildEmptyCanvas() lo deja ''). Es el
 * mismo check que usa load() internamente.
 */
export function selectT5Card(i: { canvasId: string; loadError: string | null; settled: boolean }): ToolCardState {
  if (i.loadError)        return card('T5', 'error',   null, 'Error de carga')
  if (!i.settled)         return card('T5', 'loading', null, null)
  if (i.canvasId === '')  return card('T5', 'empty',   null, 'Taxonomía sin completar')
  return card('T5', 'loaded', 'Taxonomía evaluada', null)
}

// ── Selectores por tarjeta (DERIVADAS) ────────────────────────

/**
 * T9 — AI Roadmap. DERIVADA: el roadmap sale de casos GO de T4 + freeItems
 * propios de T9. settled = settled de T4 (su única fuente cargable).
 * Si T4 falla → T9 no derivable (error heredado).
 */
export function selectT9Card(i: {
  t4GoCount: number; freeItems: FreeItem[]; t4Error: boolean; settled: boolean
}): ToolCardState {
  if (i.t4Error)   return card('T9', 'error',   null, 'T4 no disponible → roadmap no derivable')
  if (!i.settled)  return card('T9', 'loading', null, null)
  const hasBase = i.t4GoCount > 0 || i.freeItems.length > 0
  if (!hasBase)    return card('T9', 'empty', null, 'Sin casos GO ni iniciativas libres → roadmap no derivable')
  const parts: string[] = []
  if (i.t4GoCount > 0)        parts.push(`${i.t4GoCount} caso${plural(i.t4GoCount)} GO`)
  if (i.freeItems.length > 0) parts.push(`${i.freeItems.length} libre${plural(i.freeItems.length)}`)
  return card('T9', 'loaded', `Roadmap derivable (${parts.join(' · ')})`, null)
}

/**
 * T11 — Operating Rhythm. DERIVADA de T1 + CompanyProfile. El engine necesita
 * ambos: diagnóstico T1 (hasData) y perfil guardado (savedAt !== null).
 * settled = T1 settled && CompanyProfile settled. Error solo desde T1
 * (CompanyProfile no expone canal de error de carga — ver autocrítica B3).
 */
export function selectT11Card(i: {
  t1HasData: boolean; t1Error: boolean; profileSaved: boolean; settled: boolean
}): ToolCardState {
  if (i.t1Error)       return card('T11', 'error',   null, 'Diagnóstico T1 no disponible → ritmo no derivable')
  if (!i.settled)      return card('T11', 'loading', null, null)
  if (!i.t1HasData)    return card('T11', 'empty', null, 'Sin diagnóstico T1 → ritmo no derivable')
  if (!i.profileSaved) return card('T11', 'empty', null, 'Falta perfil de empresa guardado')
  return card('T11', 'loaded', 'Ritmo operativo derivable', null)
}

// ── Estado global del paquete ─────────────────────────────────

/**
 * Agrega los estados de tarjeta en el estado global del paquete, según el
 * contrato de GPT (B3): Cargando / Parcial / Completo / Sin datos / Error parcial.
 * Nunca 'complete' si hay huecos; nunca 'empty' antes de que todo esté resuelto.
 */
export function selectPortfolioGlobal(cards: ToolCardState[]): { status: PortfolioGlobalStatus; summary: string } {
  const errors  = cards.filter((c) => c.status === 'error').length
  const loading = cards.filter((c) => c.status === 'loading').length
  const loaded  = cards.filter((c) => c.status === 'loaded').length
  const empty   = cards.filter((c) => c.status === 'empty').length

  let status: PortfolioGlobalStatus
  if (loaded === 0 && loading > 0)      status = 'loading'   // nada con datos aún, algo cargando
  else if (errors > 0)                  status = 'error'     // error (parcial si además hay loaded)
  else if (loaded === 0 && loading === 0) status = 'empty'   // todo resuelto, ninguno con datos
  else if (loading > 0 || empty > 0)    status = 'partial'   // hay datos + algún hueco/cargando
  else                                  status = 'complete'  // todas con datos

  let summary: string
  if (status === 'loading') {
    summary = 'Cargando resumen del portfolio…'
  } else {
    const extras: string[] = []
    if (loading > 0) extras.push(`${loading} cargando`)
    if (empty > 0)   extras.push(`${empty} sin datos`)
    if (errors > 0)  extras.push(`${errors} con error`)
    summary = `${loaded} de ${cards.length} con datos${extras.length ? ` · ${extras.join(' · ')}` : ''}`
  }

  return { status, summary }
}
