import { describe, it, expect } from 'vitest'
import {
  RoadmapSchema,
  T1ContextSchema,
  T2ContextSchema,
  safeParseJsonField,
} from '@/lib/schemas/t4.schemas'

// ── RoadmapSchema ─────────────────────────────────────────────────

describe('RoadmapSchema', () => {
  it('payload válido completo → success: true', () => {
    const result = RoadmapSchema.safeParse({
      quarter:           'Q2 2026',
      estimatedDuration: '6 semanas',
      owner:             'Ana López',
      nextSteps:         'Kick-off con IT',
      dependencies:      'ERP integration',
      startDate:         '2026-04-01',
      endDate:           '2026-05-15',
    })
    expect(result.success).toBe(true)
  })

  it('payload vacío {} → success: true (todos los campos son opcionales)', () => {
    const result = RoadmapSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('payload con solo quarter → success: true', () => {
    const result = RoadmapSchema.safeParse({ quarter: 'Q3 2026' })
    expect(result.success).toBe(true)
  })

  it('campo con tipo incorrecto (quarter: number) → success: false', () => {
    const result = RoadmapSchema.safeParse({ quarter: 42 })
    expect(result.success).toBe(false)
  })

  it('campo con tipo incorrecto (startDate: boolean) → success: false', () => {
    const result = RoadmapSchema.safeParse({ startDate: true })
    expect(result.success).toBe(false)
  })
})

// ── T1ContextSchema ───────────────────────────────────────────────

describe('T1ContextSchema', () => {
  it('payload válido completo → success: true', () => {
    const result = T1ContextSchema.safeParse({
      relevantDimensions: ['Cultura', 'Datos', 'Procesos'],
      maturityNotes:      'Madurez media en datos estructurados',
    })
    expect(result.success).toBe(true)
  })

  it('payload mínimo válido (solo relevantDimensions vacío) → success: true', () => {
    const result = T1ContextSchema.safeParse({ relevantDimensions: [] })
    expect(result.success).toBe(true)
  })

  it('payload vacío {} → success: false (relevantDimensions es requerido)', () => {
    const result = T1ContextSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('relevantDimensions con tipo incorrecto (string en vez de array) → success: false', () => {
    const result = T1ContextSchema.safeParse({ relevantDimensions: 'Cultura' })
    expect(result.success).toBe(false)
  })

  it('relevantDimensions con elementos no-string → success: false', () => {
    const result = T1ContextSchema.safeParse({ relevantDimensions: [1, 2, 3] })
    expect(result.success).toBe(false)
  })
})

// ── T2ContextSchema ───────────────────────────────────────────────

describe('T2ContextSchema', () => {
  it('payload válido completo → success: true', () => {
    const result = T2ContextSchema.safeParse({
      championArchetype: 'Innovador',
      blockerArchetypes: ['Resistente', 'Escéptico'],
      stakeholderNotes:  'El CFO es el principal bloqueador',
    })
    expect(result.success).toBe(true)
  })

  it('payload vacío {} → success: true (todos los campos son opcionales)', () => {
    const result = T2ContextSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('payload con solo championArchetype → success: true', () => {
    const result = T2ContextSchema.safeParse({ championArchetype: 'Innovador' })
    expect(result.success).toBe(true)
  })

  it('blockerArchetypes con tipo incorrecto (string en vez de array) → success: false', () => {
    const result = T2ContextSchema.safeParse({ blockerArchetypes: 'Resistente' })
    expect(result.success).toBe(false)
  })

  it('blockerArchetypes con elementos no-string → success: false', () => {
    const result = T2ContextSchema.safeParse({ blockerArchetypes: [1, 2] })
    expect(result.success).toBe(false)
  })
})

// ── safeParseJsonField — comportamiento con null/undefined ────────
//
// Comprueba que la función helper NO explota con null/undefined
// (comportamiento garantizado por T4, replicado aquí para los 3 schemas nuevos)

describe('safeParseJsonField — null/undefined handling', () => {
  it('RoadmapSchema + null → devuelve undefined (no explota)', () => {
    const result = safeParseJsonField(RoadmapSchema, null, 'roadmap')
    expect(result).toBeUndefined()
  })

  it('RoadmapSchema + undefined → devuelve undefined (no explota)', () => {
    const result = safeParseJsonField(RoadmapSchema, undefined, 'roadmap')
    expect(result).toBeUndefined()
  })

  it('T1ContextSchema + null → devuelve undefined (no explota)', () => {
    const result = safeParseJsonField(T1ContextSchema, null, 't1_context')
    expect(result).toBeUndefined()
  })

  it('T2ContextSchema + null → devuelve undefined (no explota)', () => {
    const result = safeParseJsonField(T2ContextSchema, null, 't2_context')
    expect(result).toBeUndefined()
  })

  it('RoadmapSchema + payload inválido → devuelve el valor original como fallback (no crash)', () => {
    const bad = { quarter: 999, startDate: false }
    const result = safeParseJsonField(RoadmapSchema, bad, 'roadmap')
    // safeParseJsonField retorna value as T cuando falla (graceful fallback)
    expect(result).toBeDefined()
  })

  it('T1ContextSchema + payload inválido → devuelve valor original como fallback (no crash)', () => {
    const bad = { relevantDimensions: 'no-es-array' }
    const result = safeParseJsonField(T1ContextSchema, bad, 't1_context')
    expect(result).toBeDefined()
  })
})
