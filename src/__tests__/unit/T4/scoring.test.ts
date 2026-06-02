import { describe, it, expect } from 'vitest'
import {
  computePriorityScore,
  getGoNoGoRecommendation,
  averageStakeholderScores,
  SCORE_WEIGHTS,
  GO_NOGO_THRESHOLDS,
} from '@/modules/T4_UseCasePriorityBoard/constants'
import type { UseCaseScores } from '@/modules/T4_UseCasePriorityBoard/types'

// Helpers
const scores = (kpiImpact: number, feasibility: number, aiRisk: number, dataDependency: number): UseCaseScores =>
  ({ kpiImpact, feasibility, aiRisk, dataDependency })

describe('computePriorityScore', () => {
  it('máximo: todas las positivas al 100, negativas a 0 → 100', () => {
    const result = computePriorityScore(scores(100, 100, 0, 0))
    expect(result).toBe(100)
  })

  it('mínimo: positivas a 0, negativas al 100 → 0', () => {
    const result = computePriorityScore(scores(0, 0, 100, 100))
    expect(result).toBe(0)
  })

  it('caso neutral 50 en todo → score intermedio', () => {
    // kpi: 50×0.35 + feas: 50×0.30 + (100-50)×0.20 + (100-50)×0.15
    // = 17.5 + 15 + 10 + 7.5 = 50
    const result = computePriorityScore(scores(50, 50, 50, 50))
    expect(result).toBe(50)
  })

  it('fórmula: kpi pesa más que los demás', () => {
    // kpi 100 resto 0 → 100×0.35 = 35
    const highKpi   = computePriorityScore(scores(100, 0, 100, 100))
    // feas 100 resto 0 → 100×0.30 = 30
    const highFeas  = computePriorityScore(scores(0, 100, 100, 100))
    expect(highKpi).toBeGreaterThan(highFeas)
  })

  it('resultado redondeado a 1 decimal', () => {
    const result = computePriorityScore(scores(33, 66, 25, 75))
    expect(result).toBe(parseFloat(result.toFixed(1)))
  })

  it('aiRisk alto penaliza el score (dimensión negativa)', () => {
    const low  = computePriorityScore(scores(70, 70, 10, 10))
    const high = computePriorityScore(scores(70, 70, 90, 10))
    expect(low).toBeGreaterThan(high)
  })

  it('dataDependency alta penaliza el score (dimensión negativa)', () => {
    const low  = computePriorityScore(scores(70, 70, 10, 10))
    const high = computePriorityScore(scores(70, 70, 10, 90))
    expect(low).toBeGreaterThan(high)
  })

  it('los pesos suman 1.0', () => {
    const total = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(total).toBeCloseTo(1.0)
  })
})

describe('getGoNoGoRecommendation', () => {
  it('score ≥ 70 → GO', () => {
    expect(getGoNoGoRecommendation(GO_NOGO_THRESHOLDS.go).recommendation).toBe('go')
    expect(getGoNoGoRecommendation(100).recommendation).toBe('go')
    expect(getGoNoGoRecommendation(70).recommendation).toBe('go')
  })

  it('50 ≤ score < 70 → pending', () => {
    expect(getGoNoGoRecommendation(60).recommendation).toBe('pending')
    expect(getGoNoGoRecommendation(50).recommendation).toBe('pending')
    expect(getGoNoGoRecommendation(69.9).recommendation).toBe('pending')
  })

  it('score < 50 → no_go', () => {
    expect(getGoNoGoRecommendation(0).recommendation).toBe('no_go')
    expect(getGoNoGoRecommendation(49.9).recommendation).toBe('no_go')
  })

  it('devuelve label no vacío', () => {
    expect(getGoNoGoRecommendation(80).label).toBeTruthy()
    expect(getGoNoGoRecommendation(55).label).toBeTruthy()
    expect(getGoNoGoRecommendation(20).label).toBeTruthy()
  })
})

describe('averageStakeholderScores', () => {
  it('array vacío → null', () => {
    expect(averageStakeholderScores([])).toBeNull()
  })

  it('un stakeholder → sus mismos scores', () => {
    const result = averageStakeholderScores([{ scores: scores(80, 60, 30, 20) }])
    expect(result).toEqual({ kpiImpact: 80, feasibility: 60, aiRisk: 30, dataDependency: 20 })
  })

  it('dos stakeholders → promedio correcto', () => {
    const result = averageStakeholderScores([
      { scores: scores(80, 60, 40, 20) },
      { scores: scores(60, 40, 20, 40) },
    ])
    expect(result).toEqual({ kpiImpact: 70, feasibility: 50, aiRisk: 30, dataDependency: 30 })
  })

  it('resultado redondeado a 1 decimal', () => {
    const result = averageStakeholderScores([
      { scores: scores(100, 0, 0, 0) },
      { scores: scores(0, 0, 0, 0) },
      { scores: scores(0, 0, 0, 0) },
    ])
    // 100/3 = 33.333... → 33.3
    expect(result?.kpiImpact).toBe(33.3)
  })
})
