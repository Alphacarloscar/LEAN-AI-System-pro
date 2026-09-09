// ============================================================
// t4-risk.test.ts — Tests del scoring de T4 (Priority Score)
// ============================================================

import { describe, it, expect } from 'vitest'
import { computePriorityScore, getGoNoGoRecommendation } from '@/modules/T4_UseCasePriorityBoard/constants'
import type { UseCaseScores } from '@/modules/T4_UseCasePriorityBoard/types'

describe('T4 - computePriorityScore', () => {
  it('computes priority score with all zeros', () => {
    const scores: UseCaseScores = {
      kpiImpact: 0,
      feasibility: 0,
      aiRisk: 0,
      dataDependency: 0,
    }
    const result = computePriorityScore(scores)
    // score = 0×0.35 + 0×0.30 + (100-0)×0.20 + (100-0)×0.15
    //       = 0 + 0 + 20 + 15 = 35
    expect(result).toBe(35)
  })

  it('computes priority score with all 100', () => {
    const scores: UseCaseScores = {
      kpiImpact: 100,
      feasibility: 100,
      aiRisk: 0,
      dataDependency: 0,
    }
    const result = computePriorityScore(scores)
    // score = 100×0.35 + 100×0.30 + (100-0)×0.20 + (100-0)×0.15
    //       = 35 + 30 + 20 + 15 = 100
    expect(result).toBe(100)
  })

  it('computes priority score with maximum risk and dependency', () => {
    const scores: UseCaseScores = {
      kpiImpact: 100,
      feasibility: 100,
      aiRisk: 100,  // riesgo máximo (se invierte)
      dataDependency: 100,  // dependencia máxima (se invierte)
    }
    const result = computePriorityScore(scores)
    // score = 100×0.35 + 100×0.30 + (100-100)×0.20 + (100-100)×0.15
    //       = 35 + 30 + 0 + 0 = 65
    expect(result).toBe(65)
  })

  it('computes priority score with mid-range values', () => {
    const scores: UseCaseScores = {
      kpiImpact: 70,
      feasibility: 60,
      aiRisk: 40,
      dataDependency: 30,
    }
    const result = computePriorityScore(scores)
    // score = 70×0.35 + 60×0.30 + (100-40)×0.20 + (100-30)×0.15
    //       = 24.5 + 18 + 12 + 10.5 = 65
    expect(result).toBe(65)
  })

  it('returns score as fixed decimal with 1 place', () => {
    const scores: UseCaseScores = {
      kpiImpact: 33,
      feasibility: 33,
      aiRisk: 33,
      dataDependency: 33,
    }
    const result = computePriorityScore(scores)
    // Verify it's a number with max 1 decimal place
    expect(typeof result).toBe('number')
    expect(result.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(1)
  })
})

describe('T4 - getGoNoGoRecommendation', () => {
  it('returns GO for score >= 70', () => {
    const recommendation = getGoNoGoRecommendation(75)
    expect(recommendation.recommendation).toBe('go')
    expect(recommendation.label).toContain('GO')
  })

  it('returns GO for score exactly 70', () => {
    const recommendation = getGoNoGoRecommendation(70)
    expect(recommendation.recommendation).toBe('go')
  })

  it('returns PENDING for score >= 50 and < 70', () => {
    const recommendation = getGoNoGoRecommendation(60)
    expect(recommendation.recommendation).toBe('pending')
    expect(recommendation.label).toContain('Revisar')
  })

  it('returns PENDING for score exactly 50', () => {
    const recommendation = getGoNoGoRecommendation(50)
    expect(recommendation.recommendation).toBe('pending')
  })

  it('returns NO_GO for score < 50', () => {
    const recommendation = getGoNoGoRecommendation(40)
    expect(recommendation.recommendation).toBe('no_go')
    expect(recommendation.label).toContain('NO-GO')
  })

  it('returns NO_GO for score exactly 0', () => {
    const recommendation = getGoNoGoRecommendation(0)
    expect(recommendation.recommendation).toBe('no_go')
  })

  it('GO recommendation has success badge colors', () => {
    const recommendation = getGoNoGoRecommendation(75)
    expect(recommendation.badgeBg).toContain('success')
  })

  it('PENDING recommendation has warning badge colors', () => {
    const recommendation = getGoNoGoRecommendation(55)
    expect(recommendation.badgeBg).toContain('warning')
  })

  it('NO_GO recommendation has danger badge colors', () => {
    const recommendation = getGoNoGoRecommendation(30)
    expect(recommendation.badgeBg).toContain('danger')
  })
})
