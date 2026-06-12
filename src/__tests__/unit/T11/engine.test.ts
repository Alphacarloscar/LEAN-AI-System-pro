import { describe, it, expect } from 'vitest'
import {
  calcMaturityAvg,
  scoreToTier,
  getAdaptiveMode,
  getRecommendedEvents,
  buildOperatingModel,
} from '@/modules/T11_OperatingRhythm/engine'
import { T11_EVENTS_CATALOG } from '@/modules/T11_OperatingRhythm/constants'
import type { RadarDimension } from '@/shared/components/charts/LeanRadarChart'

// ── Helpers ───────────────────────────────────────────────────

function radar(values: number[]): RadarDimension[] {
  return values.map((current, i) => ({ dimension: `d${i}`, current, target: 4 }))
}

// ── calcMaturityAvg ───────────────────────────────────────────

describe('calcMaturityAvg', () => {
  it('array vacío → 0', () => {
    expect(calcMaturityAvg([])).toBe(0)
  })

  it('un elemento → su valor', () => {
    expect(calcMaturityAvg(radar([3]))).toBe(3)
  })

  it('varios elementos → promedio correcto', () => {
    // (1 + 2 + 3 + 4) / 4 = 2.5
    expect(calcMaturityAvg(radar([1, 2, 3, 4]))).toBe(2.5)
  })

  it('resultado redondeado a 2 decimales', () => {
    // (1 + 2 + 3) / 3 = 2.0
    const result = calcMaturityAvg(radar([1, 2, 3]))
    expect(result).toBe(parseFloat(result.toFixed(2)))
  })

  it('usa el campo current de cada dimensión', () => {
    const dims: RadarDimension[] = [
      { dimension: 'a', current: 2, target: 4 },
      { dimension: 'b', current: 4, target: 4 },
    ]
    expect(calcMaturityAvg(dims)).toBe(3)
  })
})

// ── scoreToTier ───────────────────────────────────────────────

describe('scoreToTier', () => {
  it('avg < 1.5 → foundational', () => {
    expect(scoreToTier(0)).toBe('foundational')
    expect(scoreToTier(1)).toBe('foundational')
    expect(scoreToTier(1.49)).toBe('foundational')
  })

  it('1.5 ≤ avg < 2.5 → developing', () => {
    expect(scoreToTier(1.5)).toBe('developing')
    expect(scoreToTier(2)).toBe('developing')
    expect(scoreToTier(2.49)).toBe('developing')
  })

  it('2.5 ≤ avg < 3.5 → advanced', () => {
    expect(scoreToTier(2.5)).toBe('advanced')
    expect(scoreToTier(3)).toBe('advanced')
    expect(scoreToTier(3.49)).toBe('advanced')
  })

  it('avg ≥ 3.5 → optimised', () => {
    expect(scoreToTier(3.5)).toBe('optimised')
    expect(scoreToTier(4)).toBe('optimised')
  })
})

// ── getAdaptiveMode ───────────────────────────────────────────

describe('getAdaptiveMode', () => {
  it('avg < 2 → basic', () => {
    expect(getAdaptiveMode(0)).toBe('basic')
    expect(getAdaptiveMode(1.5)).toBe('basic')
    expect(getAdaptiveMode(1.99)).toBe('basic')
  })

  it('2 ≤ avg ≤ 3 → standard', () => {
    expect(getAdaptiveMode(2)).toBe('standard')
    expect(getAdaptiveMode(2.5)).toBe('standard')
    expect(getAdaptiveMode(3)).toBe('standard')
  })

  it('avg > 3 → full', () => {
    expect(getAdaptiveMode(3.01)).toBe('full')
    expect(getAdaptiveMode(4)).toBe('full')
  })
})

// ── getRecommendedEvents ──────────────────────────────────────

describe('getRecommendedEvents', () => {
  it('modo basic (avg < 2): solo eventos isCritical dentro del tier', () => {
    const events = getRecommendedEvents('foundational', 1.5)
    expect(events.every((e) => e.isCritical)).toBe(true)
  })

  it('modo full (avg > 3): devuelve todos los eventos del catálogo', () => {
    const events = getRecommendedEvents('optimised', 3.5)
    expect(events.length).toBe(T11_EVENTS_CATALOG.length)
  })

  it('modo standard: no incluye eventos cuyo minTier supera el tier actual', () => {
    // foundational: no debe incluir eventos con minTier = 'developing', 'advanced', 'optimised'
    const events = getRecommendedEvents('foundational', 2.5)
    expect(events.every((e) => e.minTier === 'foundational')).toBe(true)
  })

  it('modo standard developing: incluye foundational + developing, excluye advanced+', () => {
    const events = getRecommendedEvents('developing', 2.5)
    const allowed = new Set(['foundational', 'developing'])
    expect(events.every((e) => allowed.has(e.minTier))).toBe(true)
  })

  it('eventos del catálogo tienen ids únicos', () => {
    const ids = T11_EVENTS_CATALOG.map((e) => e.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })
})

// ── buildOperatingModel ───────────────────────────────────────

describe('buildOperatingModel', () => {
  it('devuelve el tier correcto para radar básico', () => {
    const model = buildOperatingModel({ radar: radar([1, 1]), employees: 50 })
    expect(model.maturityTier).toBe('foundational')
  })

  it('maturityAvg coincide con calcMaturityAvg del radar', () => {
    const r = radar([2, 3, 2, 3])
    const model = buildOperatingModel({ radar: r, employees: 100 })
    expect(model.maturityAvg).toBe(calcMaturityAvg(r))
  })

  it('contiene decisions, phaseObjectives y kpiGroups no vacíos', () => {
    const model = buildOperatingModel({ radar: radar([2, 2, 2]), employees: 200 })
    expect(model.decisions.length).toBeGreaterThan(0)
    expect(model.phaseObjectives.length).toBeGreaterThan(0)
    expect(model.kpiGroups.length).toBeGreaterThan(0)
  })

  it('adaptiveMode es coherente con el avg (avg 3.5 → full)', () => {
    const model = buildOperatingModel({ radar: radar([3.5, 3.5]), employees: 300 })
    expect(model.adaptiveMode).toBe('full')
    expect(model.maturityTier).toBe('optimised')
  })

  it('radar vacío → tier foundational, avg 0, basic mode', () => {
    const model = buildOperatingModel({ radar: [], employees: 10 })
    expect(model.maturityTier).toBe('foundational')
    expect(model.maturityAvg).toBe(0)
    expect(model.adaptiveMode).toBe('basic')
  })
})
