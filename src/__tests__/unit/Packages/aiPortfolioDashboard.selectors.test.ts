// ============================================================
// Tests — aiPortfolioDashboard.selectors  (FDR-002, B3)
//
// Selectores PUROS: testeables sin montar React ni stores.
// Cobertura prioritaria (convergencia con Gemini):
//   — Regla de oro: settled=false ⇒ 'loading', nunca 'empty'.
//   — Señal de error real (loadError / error heredado), no inferida.
//   — Derivadas: T9 ← T4, T11 ← T1 + CompanyProfile.
//   — Agregador global: precedencia loading > error > partial > complete > empty.
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  selectT3Card,
  selectT4Card,
  selectT5Card,
  selectT9Card,
  selectT11Card,
  selectPortfolioGlobal,
  type ToolCardState,
} from '@/modules/Packages/selectors/aiPortfolioDashboard.selectors'
import type { ValueStream } from '@/modules/T3_ValueStreamMap/types'
import type { UseCase }     from '@/modules/T4_UseCasePriorityBoard/types'
import type { FreeItem }    from '@/modules/T9_AIRoadmap/types'

// ── Fixtures mínimos (solo los campos que el selector lee) ─────
const proc = (): ValueStream => ({} as ValueStream)
const uc = (status: UseCase['status']): UseCase => ({ status } as UseCase)
const freeItem = (): FreeItem => ({} as FreeItem)
const card = (s: ToolCardState['status']): ToolCardState =>
  ({ code: 'T4', status: s, metric: null, note: null })

// ── Regla de oro: frío ≠ vacío ────────────────────────────────

describe('regla de oro (settled=false ⇒ loading, nunca empty)', () => {
  it('T3 sin datos pero no settled → loading', () => {
    const r = selectT3Card({ processes: [], hasData: false, loadError: null, settled: false })
    expect(r.status).toBe('loading')
  })
  it('T4 sin casos pero no settled → loading', () => {
    const r = selectT4Card({ useCases: [], loadError: null, settled: false })
    expect(r.status).toBe('loading')
  })
  it('T5 canvas vacío pero no settled → loading', () => {
    const r = selectT5Card({ canvasId: '', loadError: null, settled: false })
    expect(r.status).toBe('loading')
  })
  it('T3 sin datos Y settled → empty (vacío honesto)', () => {
    const r = selectT3Card({ processes: [], hasData: false, loadError: null, settled: true })
    expect(r.status).toBe('empty')
  })
})

// ── Señal de error real ───────────────────────────────────────

describe('error real (no inferido)', () => {
  it('T4 loadError "timeout" → error con nota de tiempo agotado', () => {
    const r = selectT4Card({ useCases: [], loadError: 'timeout', settled: true })
    expect(r.status).toBe('error')
    expect(r.note).toMatch(/agotado/i)
  })
  it('T3 error solo si loadError Y sin datos (error no enmascara datos)', () => {
    const conDatos = selectT3Card({ processes: [proc()], hasData: true, loadError: 'x', settled: true })
    expect(conDatos.status).toBe('loaded')
    const sinDatos = selectT3Card({ processes: [], hasData: false, loadError: 'x', settled: true })
    expect(sinDatos.status).toBe('error')
  })
})

// ── Datos reales ──────────────────────────────────────────────

describe('estados loaded con métrica', () => {
  it('T4 cuenta casos y priorizados (GO)', () => {
    const r = selectT4Card({ useCases: [uc('go'), uc('go'), uc('hold')], loadError: null, settled: true })
    expect(r.status).toBe('loaded')
    expect(r.metric).toBe('3 casos · 2 priorizados')
  })
  it('T4 singular sin plural incorrecto', () => {
    const r = selectT4Card({ useCases: [uc('go')], loadError: null, settled: true })
    expect(r.metric).toBe('1 caso · 1 priorizado')
  })
  it('T5 canvas con id → loaded', () => {
    const r = selectT5Card({ canvasId: 'abc', loadError: null, settled: true })
    expect(r.status).toBe('loaded')
  })
})

// ── Derivadas: T9 ← T4 ────────────────────────────────────────

describe('T9 derivada de T4', () => {
  it('T4 en error → T9 error (no derivable)', () => {
    const r = selectT9Card({ t4GoCount: 0, freeItems: [], t4Error: true, settled: true })
    expect(r.status).toBe('error')
  })
  it('sin casos GO ni libres → empty', () => {
    const r = selectT9Card({ t4GoCount: 0, freeItems: [], t4Error: false, settled: true })
    expect(r.status).toBe('empty')
  })
  it('con casos GO → loaded', () => {
    const r = selectT9Card({ t4GoCount: 2, freeItems: [], t4Error: false, settled: true })
    expect(r.status).toBe('loaded')
    expect(r.metric).toMatch(/2 casos GO/)
  })
  it('solo iniciativas libres → loaded', () => {
    const r = selectT9Card({ t4GoCount: 0, freeItems: [freeItem()], t4Error: false, settled: true })
    expect(r.status).toBe('loaded')
    expect(r.metric).toMatch(/1 libre/)
  })
  it('no settled → loading aunque T4 ya tenga GO', () => {
    const r = selectT9Card({ t4GoCount: 5, freeItems: [], t4Error: false, settled: false })
    expect(r.status).toBe('loading')
  })
})

// ── Derivadas: T11 ← T1 + CompanyProfile ──────────────────────

describe('T11 derivada de T1 + perfil', () => {
  it('T1 en error → error', () => {
    const r = selectT11Card({ t1HasData: false, t1Error: true, profileSaved: false, settled: true })
    expect(r.status).toBe('error')
  })
  it('sin diagnóstico T1 → empty', () => {
    const r = selectT11Card({ t1HasData: false, t1Error: false, profileSaved: true, settled: true })
    expect(r.status).toBe('empty')
  })
  it('con T1 pero sin perfil guardado → empty (falta perfil)', () => {
    const r = selectT11Card({ t1HasData: true, t1Error: false, profileSaved: false, settled: true })
    expect(r.status).toBe('empty')
  })
  it('T1 + perfil → loaded', () => {
    const r = selectT11Card({ t1HasData: true, t1Error: false, profileSaved: true, settled: true })
    expect(r.status).toBe('loaded')
  })
  it('no settled → loading aunque falten ambos', () => {
    const r = selectT11Card({ t1HasData: false, t1Error: false, profileSaved: false, settled: false })
    expect(r.status).toBe('loading')
  })
})

// ── Agregador global ──────────────────────────────────────────

describe('selectPortfolioGlobal (precedencia)', () => {
  it('nada con datos + algo cargando → loading', () => {
    const { status } = selectPortfolioGlobal([card('loading'), card('loading')])
    expect(status).toBe('loading')
  })
  it('hay datos + algún error → error', () => {
    const { status } = selectPortfolioGlobal([card('loaded'), card('error')])
    expect(status).toBe('error')
  })
  it('error gana a partial cuando ya hay un loaded', () => {
    const { status } = selectPortfolioGlobal([card('loaded'), card('empty'), card('error')])
    expect(status).toBe('error')
  })
  it('datos + hueco (empty/loading) sin error → partial', () => {
    const { status } = selectPortfolioGlobal([card('loaded'), card('empty')])
    expect(status).toBe('partial')
  })
  it('todo loaded → complete', () => {
    const { status } = selectPortfolioGlobal([card('loaded'), card('loaded')])
    expect(status).toBe('complete')
  })
  it('todo resuelto sin datos → empty', () => {
    const { status } = selectPortfolioGlobal([card('empty'), card('empty')])
    expect(status).toBe('empty')
  })
  it('summary refleja recuento de fuentes con datos', () => {
    const { summary } = selectPortfolioGlobal([card('loaded'), card('empty'), card('error')])
    expect(summary).toMatch(/^1 de 3 con datos/)
  })
})
