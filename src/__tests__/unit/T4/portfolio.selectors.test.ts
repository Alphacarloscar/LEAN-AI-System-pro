// ============================================================
// Tests — T4 portfolio.selectors  (FDR-002 · ownership)
//
// Verifican la INVARIANCIA de la lógica extraída de T10View.liveT4:
// misma fórmula, mismos redondeos, misma forma de salida. Si un test
// aquí cambia de valor, es que alguien alteró números que T10 enseña
// en producción → debe ser decisión de producto explícita.
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  selectT4PortfolioMetrics,
  selectGoUseCases,
  selectGoUseCaseCount,
} from '@/modules/T4_UseCasePriorityBoard/selectors/portfolio.selectors'
import type { UseCase, UseCaseEconomics, UseCaseStatus } from '@/modules/T4_UseCasePriorityBoard/types'

// ── Fixtures mínimos (solo campos que el selector lee) ────────

const econ = (over: Partial<UseCaseEconomics> = {}): UseCaseEconomics => ({
  processHoursPerWeek: 10, headcount: 5, efficiencyGain: 0.40,
  efficiencyGainMode: 'benchmark', hourlyRate: 45, hourlyRateMode: 'preset',
  hourlyRatePreset: 'tecnico', implementationCost: 30_000,
  implementationCostMode: 'benchmark', ...over,
})

const uc = (over: Partial<UseCase> = {}): UseCase =>
  ({ name: 'X', status: 'candidato', priorityScore: 0, ...over } as UseCase)

// ── Portfolio vacío ───────────────────────────────────────────

describe('selectT4PortfolioMetrics — vacío', () => {
  it('sin casos → todo a cero y topInitiatives vacío', () => {
    const m = selectT4PortfolioMetrics([])
    expect(m).toEqual({
      totalInitiatives: 0, estimatedValue: 0, totalInvestment: 0, ahorroAnual: 0,
      paybackMeses: 0, roi3years: 0, roi: 0,
      statuses: { active: 0, validating: 0, backlog: 0, stopped: 0 },
      topInitiatives: [],
    })
  })
})

// ── Cálculo económico (invariancia de fórmula) ────────────────

describe('selectT4PortfolioMetrics — economía', () => {
  it('un caso con economics base: ahorro, inversión, payback, roi3 y ratio roi', () => {
    const m = selectT4PortfolioMetrics([uc({ status: 'go', economics: econ() })])
    // ahorro = 10×5×52×0.40×45 = 46_800 (sin redondear per-caso, suma directa)
    expect(m.ahorroAnual).toBe(46_800)
    expect(m.totalInvestment).toBe(30_000)
    // payback = (30_000/46_800)×12 = 7.69 → media redondeada = 8
    expect(m.paybackMeses).toBe(8)
    // roi3 = ((46_800×3 − 30_000)/30_000)×100 = 368
    expect(m.roi3years).toBe(368)
    // ratio roi = round((46_800×3/30_000)×10)/10 = 4.7
    expect(m.roi).toBe(4.7)
  })

  it('inversión 0 → sin Infinity/NaN (payback, roi3, roi = 0)', () => {
    const m = selectT4PortfolioMetrics([uc({ status: 'go', economics: econ({ implementationCost: 0 }) })])
    expect(m.paybackMeses).toBe(0)
    expect(m.roi3years).toBe(0)
    expect(m.roi).toBe(0)
    expect(Number.isFinite(m.roi)).toBe(true)
  })

  it('casos sin economics no rompen ni suman inversión', () => {
    const m = selectT4PortfolioMetrics([uc({ status: 'go' }), uc({ status: 'priorizado' })])
    expect(m.totalInvestment).toBe(0)
    expect(m.ahorroAnual).toBe(0)
    expect(m.paybackMeses).toBe(0)
  })
})

// ── Statuses ──────────────────────────────────────────────────

describe('selectT4PortfolioMetrics — statuses', () => {
  it('cuenta active/validating/backlog/stopped según status real', () => {
    const cases: UseCaseStatus[] = ['go', 'en_piloto', 'completado', 'priorizado', 'candidato', 'no_go']
    const m = selectT4PortfolioMetrics(cases.map(s => uc({ status: s })))
    expect(m.statuses).toEqual({ active: 3, validating: 1, backlog: 1, stopped: 1 })
    expect(m.totalInitiatives).toBe(6)
  })
})

// ── topInitiatives (orden, límite, mapeo de status) ───────────

describe('selectT4PortfolioMetrics — topInitiatives', () => {
  it('ordena por priorityScore desc, limita a 3 y mapea status', () => {
    const m = selectT4PortfolioMetrics([
      uc({ name: 'A', status: 'go',         priorityScore: 90, economics: econ({ implementationCost: 1000 }) }),
      uc({ name: 'B', status: 'priorizado', priorityScore: 80, economics: econ({ implementationCost: 2000 }) }),
      uc({ name: 'C', status: 'en_piloto',  priorityScore: 70 }),
      uc({ name: 'D', status: 'go',         priorityScore: 60 }),
      uc({ name: 'E', status: 'candidato',  priorityScore: 99 }), // excluido: no priorizable
    ])
    expect(m.topInitiatives.map(t => t.name)).toEqual(['A', 'B', 'C'])
    expect(m.topInitiatives[0]).toEqual({ name: 'A', status: 'active', value: 1000 })
    expect(m.topInitiatives[1].status).toBe('validating') // priorizado → validating
    expect(m.topInitiatives[2].status).toBe('active')     // en_piloto → active
  })
})

// ── selectGoUseCases / Count ──────────────────────────────────

describe('selectGoUseCases', () => {
  it('devuelve solo status === "go" (no en_piloto ni completado)', () => {
    const cases = [uc({ status: 'go' }), uc({ status: 'en_piloto' }), uc({ status: 'go' }), uc({ status: 'completado' })]
    expect(selectGoUseCases(cases)).toHaveLength(2)
    expect(selectGoUseCaseCount(cases)).toBe(2)
  })
  it('vacío → 0', () => {
    expect(selectGoUseCaseCount([])).toBe(0)
  })
})
