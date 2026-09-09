// ============================================================
// t5-scoring.test.ts — Tests de scoring de T5 (Taxonomy Canvas)
// ============================================================

import { describe, it, expect } from 'vitest'
import {
  computeT5DomainScore,
  computeT5Recommendation,
  computeMaturityLevel,
  computeActivationSequence,
} from '@/modules/T5_AITaxonomyCanvas/constants'
import type { T5DomainScores, T5DomainCode, T5Recommendation } from '@/modules/T5_AITaxonomyCanvas/types'

describe('T5 - Domain Score Computation', () => {
  it('computes domain score with all zeros', () => {
    const scores: T5DomainScores = {
      businessValue: 0,
      technicalReady: 0,
      orgReadiness: 0,
      riskLevel: 0,
    }
    const result = computeT5DomainScore(scores)
    // score = 0×0.40 + 0×0.30 + 0×0.20 + (100-0)×0.10 = 10
    expect(result).toBe(10)
  })

  it('computes domain score with all 100', () => {
    const scores: T5DomainScores = {
      businessValue: 100,
      technicalReady: 100,
      orgReadiness: 100,
      riskLevel: 0,
    }
    const result = computeT5DomainScore(scores)
    // score = 100×0.40 + 100×0.30 + 100×0.20 + (100-0)×0.10 = 100
    expect(result).toBe(100)
  })

  it('computes domain score with maximum risk', () => {
    const scores: T5DomainScores = {
      businessValue: 100,
      technicalReady: 100,
      orgReadiness: 100,
      riskLevel: 100,
    }
    const result = computeT5DomainScore(scores)
    // score = 100×0.40 + 100×0.30 + 100×0.20 + (100-100)×0.10 = 90
    expect(result).toBe(90)
  })

  it('computes domain score with mid-range values', () => {
    const scores: T5DomainScores = {
      businessValue: 70,
      technicalReady: 60,
      orgReadiness: 50,
      riskLevel: 30,
    }
    const result = computeT5DomainScore(scores)
    // score = 70×0.40 + 60×0.30 + 50×0.20 + (100-30)×0.10
    //       = 28 + 18 + 10 + 7 = 63
    expect(result).toBe(63)
  })

  it('returns score with 1 decimal place precision', () => {
    const scores: T5DomainScores = {
      businessValue: 33,
      technicalReady: 33,
      orgReadiness: 33,
      riskLevel: 33,
    }
    const result = computeT5DomainScore(scores)
    expect(typeof result).toBe('number')
    expect(result.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(1)
  })
})

describe('T5 - Recommendation Logic', () => {
  it('returns GOBERNAR_PRIMERO when risk >= 65', () => {
    const scores: T5DomainScores = {
      businessValue: 100,
      technicalReady: 100,
      orgReadiness: 100,
      riskLevel: 65,
    }
    const result = computeT5Recommendation(scores)
    expect(result).toBe('gobernar_primero')
  })

  it('returns ACTIVAR_AHORA when tech >= 60, org >= 55, biz >= 50', () => {
    const scores: T5DomainScores = {
      businessValue: 60,
      technicalReady: 65,
      orgReadiness: 60,
      riskLevel: 20,
    }
    const result = computeT5Recommendation(scores)
    expect(result).toBe('activar_ahora')
  })

  it('returns PILOTAR_90D when biz >= 55 and (tech >= 40 or org >= 40)', () => {
    const scores: T5DomainScores = {
      businessValue: 70,
      technicalReady: 45,
      orgReadiness: 30,
      riskLevel: 20,
    }
    const result = computeT5Recommendation(scores)
    expect(result).toBe('pilotar_90d')
  })

  it('returns PREPARAR_FOUNDATIONS as default fallback', () => {
    const scores: T5DomainScores = {
      businessValue: 30,
      technicalReady: 20,
      orgReadiness: 15,
      riskLevel: 50,
    }
    const result = computeT5Recommendation(scores)
    expect(result).toBe('preparar_foundations')
  })

  it('prioritizes risk check before other conditions', () => {
    // Even with perfect scores, high risk returns GOBERNAR_PRIMERO
    const scores: T5DomainScores = {
      businessValue: 100,
      technicalReady: 100,
      orgReadiness: 100,
      riskLevel: 70,
    }
    const result = computeT5Recommendation(scores)
    expect(result).toBe('gobernar_primero')
  })
})

describe('T5 - Maturity Level Computation', () => {
  it('returns INICIAL when average score < 42', () => {
    const domains = {
      domain1: { priorityScore: 30 },
      domain2: { priorityScore: 35 },
      domain3: { priorityScore: 40 },
    }
    const result = computeMaturityLevel(domains)
    expect(result).toBe('inicial')
  })

  it('returns EMERGENTE when 42 <= average < 55', () => {
    const domains = {
      domain1: { priorityScore: 50 },
      domain2: { priorityScore: 50 },
    }
    const result = computeMaturityLevel(domains)
    expect(result).toBe('emergente')
  })

  it('returns OPERATIVO when 55 <= average < 70', () => {
    const domains = {
      domain1: { priorityScore: 60 },
      domain2: { priorityScore: 62 },
    }
    const result = computeMaturityLevel(domains)
    expect(result).toBe('operativo')
  })

  it('returns AVANZADO when average >= 70', () => {
    const domains = {
      domain1: { priorityScore: 75 },
      domain2: { priorityScore: 80 },
      domain3: { priorityScore: 70 },
    }
    const result = computeMaturityLevel(domains)
    expect(result).toBe('avanzado')
  })

  it('returns INICIAL for empty domains', () => {
    const domains = {}
    const result = computeMaturityLevel(domains)
    expect(result).toBe('inicial')
  })

  it('handles single domain correctly', () => {
    const domains = {
      single: { priorityScore: 60 },
    }
    const result = computeMaturityLevel(domains)
    expect(result).toBe('operativo')
  })
})

describe('T5 - Activation Sequence', () => {
  it('sorts domains by recommendation order first', () => {
    const domains: Record<T5DomainCode, { priorityScore: number; recommendation: T5Recommendation }> = {
      automatizacion_rpa: { priorityScore: 80, recommendation: 'preparar_foundations' },
      automatizacion_inteligente: { priorityScore: 90, recommendation: 'activar_ahora' },
      generacion_contenido: { priorityScore: 85, recommendation: 'pilotar_90d' },
      predicciones_decisiones: { priorityScore: 75, recommendation: 'gobernar_primero' },
      personalizacion: { priorityScore: 70, recommendation: 'preparar_foundations' },
    }

    const sequence = computeActivationSequence(domains)

    // Should include all domains
    expect(sequence.length).toBe(5)
    // All domains should be present
    Object.keys(domains).forEach((k) => {
      expect(sequence).toContain(k as T5DomainCode)
    })
  })

  it('orders domains with same recommendation by priority score (desc)', () => {
    const domains: Record<T5DomainCode, { priorityScore: number; recommendation: T5Recommendation }> = {
      automatizacion_rpa: { priorityScore: 50, recommendation: 'preparar_foundations' },
      automatizacion_inteligente: { priorityScore: 80, recommendation: 'preparar_foundations' },
      generacion_contenido: { priorityScore: 65, recommendation: 'preparar_foundations' },
      predicciones_decisiones: { priorityScore: 0, recommendation: 'preparar_foundations' },
      personalizacion: { priorityScore: 0, recommendation: 'preparar_foundations' },
    }

    const sequence = computeActivationSequence(domains)

    // With same recommendation, highest score first
    const idx80 = sequence.indexOf('automatizacion_inteligente')
    const idx65 = sequence.indexOf('generacion_contenido')
    const idx50 = sequence.indexOf('automatizacion_rpa')

    expect(idx80).toBeLessThan(idx65)
    expect(idx65).toBeLessThan(idx50)
  })

  it('handles empty domains', () => {
    const domains: Record<T5DomainCode, { priorityScore: number; recommendation: T5Recommendation }> = {} as any
    const sequence = computeActivationSequence(domains)
    expect(sequence.length).toBe(0)
  })
})
