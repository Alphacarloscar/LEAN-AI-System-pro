import { describe, it, expect } from 'vitest'
import {
  computeT5DomainScore,
  computeT5Recommendation,
  computeMaturityLevel,
  computeActivationSequence,
  T5_RECOMMENDATION_CONFIG,
} from '@/modules/T5_AITaxonomyCanvas/constants'
import type { T5DomainScores, T5DomainCode, T5Recommendation } from '@/modules/T5_AITaxonomyCanvas/types'

// ── Helpers ───────────────────────────────────────────────────

function scores(
  businessValue: number,
  technicalReady: number,
  orgReadiness: number,
  riskLevel: number,
): T5DomainScores {
  return { businessValue, technicalReady, orgReadiness, riskLevel }
}

function domainRecord(
  priorityScore: number,
  recommendation: T5Recommendation,
): { priorityScore: number; recommendation: T5Recommendation } {
  return { priorityScore, recommendation }
}

// ── computeT5DomainScore ──────────────────────────────────────

describe('computeT5DomainScore', () => {
  it('máximo: positivas 100, riesgo 0 → 100', () => {
    // 100×0.40 + 100×0.30 + 100×0.20 + (100-0)×0.10 = 100
    expect(computeT5DomainScore(scores(100, 100, 100, 0))).toBe(100)
  })

  it('mínimo: positivas 0, riesgo 100 → 0', () => {
    // 0×0.40 + 0×0.30 + 0×0.20 + (100-100)×0.10 = 0
    expect(computeT5DomainScore(scores(0, 0, 0, 100))).toBe(0)
  })

  it('caso neutral 50 en todo → score intermedio 50', () => {
    // 50×0.40 + 50×0.30 + 50×0.20 + (100-50)×0.10 = 20+15+10+5 = 50
    expect(computeT5DomainScore(scores(50, 50, 50, 50))).toBe(50)
  })

  it('businessValue pesa más que technicalReady (0.40 vs 0.30)', () => {
    const highBV   = computeT5DomainScore(scores(100, 0, 0, 0))
    const highTR   = computeT5DomainScore(scores(0, 100, 0, 0))
    expect(highBV).toBeGreaterThan(highTR)
  })

  it('riskLevel alto penaliza el score', () => {
    const lowRisk  = computeT5DomainScore(scores(70, 70, 70, 10))
    const highRisk = computeT5DomainScore(scores(70, 70, 70, 90))
    expect(lowRisk).toBeGreaterThan(highRisk)
  })

  it('resultado redondeado a 1 decimal', () => {
    const result = computeT5DomainScore(scores(33, 66, 25, 75))
    expect(result).toBe(parseFloat(result.toFixed(1)))
  })
})

// ── computeT5Recommendation ───────────────────────────────────

describe('computeT5Recommendation', () => {
  it('riskLevel ≥ 65 → gobernar_primero (prevalece sobre todo)', () => {
    // Aunque todo lo demás sea perfecto, el riesgo alto bloquea
    expect(computeT5Recommendation(scores(100, 100, 100, 65))).toBe('gobernar_primero')
    expect(computeT5Recommendation(scores(80, 80, 80, 80))).toBe('gobernar_primero')
  })

  it('condiciones óptimas (sin riesgo alto) → activar_ahora', () => {
    // technicalReady ≥ 60, orgReadiness ≥ 55, businessValue ≥ 50, riskLevel < 65
    expect(computeT5Recommendation(scores(60, 65, 60, 0))).toBe('activar_ahora')
    expect(computeT5Recommendation(scores(50, 60, 55, 30))).toBe('activar_ahora')
  })

  it('businessValue ≥ 55 y madurez técnica u org parcial → pilotar_90d', () => {
    // businessValue 55, technicalReady 40 (justo en umbral), orgReadiness bajo, riesgo bajo
    expect(computeT5Recommendation(scores(55, 40, 20, 0))).toBe('pilotar_90d')
    expect(computeT5Recommendation(scores(55, 20, 40, 0))).toBe('pilotar_90d')
  })

  it('perfil bajo en todo → preparar_foundations', () => {
    expect(computeT5Recommendation(scores(20, 20, 20, 0))).toBe('preparar_foundations')
    expect(computeT5Recommendation(scores(0, 0, 0, 0))).toBe('preparar_foundations')
  })

  it('riskLevel justo en umbral (64) no activa gobernar_primero', () => {
    const rec = computeT5Recommendation(scores(60, 65, 60, 64))
    expect(rec).not.toBe('gobernar_primero')
  })
})

// ── computeMaturityLevel ──────────────────────────────────────

describe('computeMaturityLevel', () => {
  it('sin dominios → inicial', () => {
    expect(computeMaturityLevel({})).toBe('inicial')
  })

  it('avg < 42 → inicial', () => {
    expect(computeMaturityLevel({ a: { priorityScore: 30 }, b: { priorityScore: 30 } })).toBe('inicial')
  })

  it('42 ≤ avg < 55 → emergente', () => {
    expect(computeMaturityLevel({ a: { priorityScore: 42 }, b: { priorityScore: 42 } })).toBe('emergente')
    expect(computeMaturityLevel({ a: { priorityScore: 50 } })).toBe('emergente')
  })

  it('55 ≤ avg < 70 → operativo', () => {
    expect(computeMaturityLevel({ a: { priorityScore: 55 }, b: { priorityScore: 55 } })).toBe('operativo')
    expect(computeMaturityLevel({ a: { priorityScore: 65 } })).toBe('operativo')
  })

  it('avg ≥ 70 → avanzado', () => {
    expect(computeMaturityLevel({ a: { priorityScore: 70 }, b: { priorityScore: 80 } })).toBe('avanzado')
    expect(computeMaturityLevel({ a: { priorityScore: 100 } })).toBe('avanzado')
  })
})

// ── computeActivationSequence ─────────────────────────────────

describe('computeActivationSequence', () => {
  it('ordena por recommendation.order ascendente', () => {
    const domains = {
      automatizacion_rpa:          domainRecord(50, 'preparar_foundations'),
      automatizacion_inteligente:  domainRecord(60, 'activar_ahora'),
    } as Record<T5DomainCode, { priorityScore: number; recommendation: T5Recommendation }>

    const seq = computeActivationSequence(domains)
    // activar_ahora (order 0) debe ir antes que preparar_foundations (order 2)
    expect(seq[0]).toBe('automatizacion_inteligente')
    expect(seq[1]).toBe('automatizacion_rpa')
  })

  it('empate en recommendation → ordena por priorityScore descendente', () => {
    const domains = {
      automatizacion_rpa:         domainRecord(40, 'pilotar_90d'),
      analitica_predictiva:       domainRecord(70, 'pilotar_90d'),
    } as Record<T5DomainCode, { priorityScore: number; recommendation: T5Recommendation }>

    const seq = computeActivationSequence(domains)
    expect(seq[0]).toBe('analitica_predictiva')
    expect(seq[1]).toBe('automatizacion_rpa')
  })

  it('devuelve todos los códigos de dominio sin omitir ninguno', () => {
    const domains = {
      automatizacion_rpa:         domainRecord(50, 'pilotar_90d'),
      automatizacion_inteligente: domainRecord(60, 'activar_ahora'),
      analitica_predictiva:       domainRecord(30, 'preparar_foundations'),
    } as Record<T5DomainCode, { priorityScore: number; recommendation: T5Recommendation }>

    const seq = computeActivationSequence(domains)
    expect(seq).toHaveLength(3)
  })

  it('T5_RECOMMENDATION_CONFIG tiene order único y ordenado (0,1,2,3)', () => {
    const orders = Object.values(T5_RECOMMENDATION_CONFIG).map((c) => c.order).sort()
    expect(orders).toEqual([0, 1, 2, 3])
  })
})
