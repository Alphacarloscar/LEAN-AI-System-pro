import { describe, it, expect } from 'vitest'
import {
  DIMENSION_DEFINITIONS,
  DIMENSION_MAP,
  SUBDIMENSION_MAP,
  TOTAL_SUBDIMENSIONS,
} from '@/modules/T1_MaturityRadar/constants'

// ── Estructura global ─────────────────────────────────────────

describe('DIMENSION_DEFINITIONS', () => {
  it('contiene exactamente 6 dimensiones', () => {
    expect(DIMENSION_DEFINITIONS).toHaveLength(6)
  })

  it('los códigos de dimensión son únicos', () => {
    const codes = DIMENSION_DEFINITIONS.map((d) => d.code)
    const unique = new Set(codes)
    expect(unique.size).toBe(6)
  })

  it('los códigos de dimensión esperados están presentes', () => {
    const codes = DIMENSION_DEFINITIONS.map((d) => d.code)
    expect(codes).toContain('strategy')
    expect(codes).toContain('data')
    expect(codes).toContain('technology')
    expect(codes).toContain('talent')
    expect(codes).toContain('processes')
    expect(codes).toContain('governance')
  })

  it('cada dimensión tiene label, dimNumber, description, weight y recommendations', () => {
    for (const dim of DIMENSION_DEFINITIONS) {
      expect(dim.label).toBeTruthy()
      expect(dim.dimNumber).toMatch(/^D[1-6]$/)
      expect(dim.description).toBeTruthy()
      expect(dim.weight).toBeGreaterThan(0)
      expect(dim.recommendations).toBeDefined()
    }
  })

  it('los pesos de todas las dimensiones suman exactamente 1.0', () => {
    const total = DIMENSION_DEFINITIONS.reduce((sum, d) => sum + d.weight, 0)
    expect(total).toBeCloseTo(1.0)
  })

  it('cada dimensión tiene exactamente 4 subdimensiones', () => {
    for (const dim of DIMENSION_DEFINITIONS) {
      expect(dim.subdimensions).toHaveLength(4)
    }
  })
})

// ── Subdimensiones ────────────────────────────────────────────

describe('subdimensiones', () => {
  it('el total de subdimensiones es 24 (6 × 4)', () => {
    expect(TOTAL_SUBDIMENSIONS).toBe(24)
  })

  it('cada subdimensión tiene code, label, subdimNumber, description y criteria', () => {
    for (const dim of DIMENSION_DEFINITIONS) {
      for (const sub of dim.subdimensions) {
        expect(sub.code).toBeTruthy()
        expect(sub.label).toBeTruthy()
        expect(sub.subdimNumber).toBeTruthy()
        expect(sub.description).toBeTruthy()
        expect(sub.criteria).toBeDefined()
      }
    }
  })

  it('cada subdimensión tiene criteria para los 5 niveles (0-4)', () => {
    for (const dim of DIMENSION_DEFINITIONS) {
      for (const sub of dim.subdimensions) {
        expect(sub.criteria[0]).toBeTruthy()
        expect(sub.criteria[1]).toBeTruthy()
        expect(sub.criteria[2]).toBeTruthy()
        expect(sub.criteria[3]).toBeTruthy()
        expect(sub.criteria[4]).toBeTruthy()
      }
    }
  })

  it('dimensionCode de cada subdimensión coincide con el code de su dimensión padre', () => {
    for (const dim of DIMENSION_DEFINITIONS) {
      for (const sub of dim.subdimensions) {
        expect(sub.dimensionCode).toBe(dim.code)
      }
    }
  })

  it('los subdimNumber siguen el patrón D{n}.{m}', () => {
    for (const sub of DIMENSION_DEFINITIONS.flatMap((d) => d.subdimensions)) {
      expect(sub.subdimNumber).toMatch(/^D[1-6]\.[1-4]$/)
    }
  })

  it('los códigos de subdimensión son únicos en toda la aplicación', () => {
    const allCodes = DIMENSION_DEFINITIONS.flatMap((d) => d.subdimensions.map((s) => s.code))
    const unique   = new Set(allCodes)
    expect(unique.size).toBe(24)
  })
})

// ── DIMENSION_MAP ─────────────────────────────────────────────

describe('DIMENSION_MAP', () => {
  it('contiene una entrada por cada código de dimensión', () => {
    const codes = DIMENSION_DEFINITIONS.map((d) => d.code)
    for (const code of codes) {
      expect(DIMENSION_MAP[code]).toBeDefined()
    }
  })

  it('lookup por código retorna la dimensión correcta', () => {
    expect(DIMENSION_MAP['strategy'].label).toBe('Estrategia')
    expect(DIMENSION_MAP['data'].label).toBe('Datos')
    expect(DIMENSION_MAP['technology'].label).toBe('Tecnología')
    expect(DIMENSION_MAP['talent'].label).toBe('Talento')
    expect(DIMENSION_MAP['processes'].label).toBe('Procesos')
    expect(DIMENSION_MAP['governance'].label).toBe('Gobernanza')
  })

  it('un código inexistente retorna undefined', () => {
    expect(DIMENSION_MAP['nonexistent']).toBeUndefined()
  })
})

// ── SUBDIMENSION_MAP ──────────────────────────────────────────

describe('SUBDIMENSION_MAP', () => {
  it('contiene exactamente 24 entradas', () => {
    expect(Object.keys(SUBDIMENSION_MAP)).toHaveLength(24)
  })

  it('lookup por código de subdimensión retorna la subdimensión correcta', () => {
    const sub = SUBDIMENSION_MAP['strategy-vision']
    expect(sub).toBeDefined()
    expect(sub.label).toBeTruthy()
    expect(sub.dimensionCode).toBe('strategy')
  })

  it('lookup por código de data retorna la subdimensión correcta', () => {
    const sub = SUBDIMENSION_MAP['data-availability']
    expect(sub).toBeDefined()
    expect(sub.dimensionCode).toBe('data')
  })

  it('un código inexistente retorna undefined', () => {
    expect(SUBDIMENSION_MAP['unknown-code']).toBeUndefined()
  })

  it('cada subdimensión en el mapa tiene sus 5 criterios de evaluación', () => {
    for (const sub of Object.values(SUBDIMENSION_MAP)) {
      for (let level = 0; level <= 4; level++) {
        expect(sub.criteria[level as 0|1|2|3|4]).toBeTruthy()
      }
    }
  })
})

// ── Recomendaciones por nivel ─────────────────────────────────

describe('recommendations por dimensión', () => {
  it('cada dimensión tiene recomendaciones para los 4 niveles de madurez', () => {
    const levels = ['inicial', 'exploracion', 'desarrollo', 'avanzado'] as const
    for (const dim of DIMENSION_DEFINITIONS) {
      for (const level of levels) {
        expect(dim.recommendations[level]).toBeTruthy()
      }
    }
  })
})
