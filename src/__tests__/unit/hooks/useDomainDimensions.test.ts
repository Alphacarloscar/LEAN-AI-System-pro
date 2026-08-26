// ============================================================
// useDomainDimensions — Tests
//
// Validates domain-aware dimension selection:
// - AI Adoption uses DIMENSION_DEFINITIONS (hardcoded)
// - Transformación Digital uses TD_DIMENSION_DEFINITIONS
// - Unknown slugs fallback to AI Adoption with warning
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDomainDimensions } from '@/hooks/useDomainDimensions'
import { useDomainSlug } from '@/hooks/useDomainSlug'
import { DIMENSION_DEFINITIONS } from '@/modules/T1_MaturityRadar/constants'
import { TD_DIMENSION_DEFINITIONS } from '@/modules/T1_MaturityRadar/domains/transformacion-digital'

// ── Mocks ────────────────────────────────────────────────────

vi.mock('@/hooks/useDomainSlug')

// ── Tests ────────────────────────────────────────────────────

describe('useDomainDimensions', () => {
  const mockUseDomainSlug = vi.mocked(useDomainSlug)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('retorna DIMENSION_DEFINITIONS para slug ai_adoption', () => {
    mockUseDomainSlug.mockReturnValue({
      domainId: 'domain-1',
      domainSlug: 'ai_adoption',
      domainLabel: 'AI Adoption',
    })

    const result = useDomainDimensions()

    expect(result.dimensions).toBe(DIMENSION_DEFINITIONS)
    expect(result.domainSlug).toBe('ai_adoption')
    expect(result.domainLabel).toBe('AI Adoption')
  })

  it('retorna TD_DIMENSION_DEFINITIONS para slug transformacion_digital', () => {
    mockUseDomainSlug.mockReturnValue({
      domainId: 'domain-2',
      domainSlug: 'transformacion_digital',
      domainLabel: 'Transformación Digital',
    })

    const result = useDomainDimensions()

    expect(result.dimensions).toBe(TD_DIMENSION_DEFINITIONS)
    expect(result.domainSlug).toBe('transformacion_digital')
    expect(result.domainLabel).toBe('Transformación Digital')
  })

  it('retorna fallback a ai_adoption para slug desconocido', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockUseDomainSlug.mockReturnValue({
      domainId: 'domain-3',
      domainSlug: 'unknown_domain',
      domainLabel: 'Unknown Domain',
    })

    const result = useDomainDimensions()

    expect(result.dimensions).toBe(DIMENSION_DEFINITIONS)
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown domain slug: \'unknown_domain\'')
    )
    consoleWarnSpy.mockRestore()
  })

  it('retorna fallback a ai_adoption para slug null', () => {
    mockUseDomainSlug.mockReturnValue({
      domainId: null,
      domainSlug: null,
      domainLabel: null,
    })

    const result = useDomainDimensions()

    expect(result.dimensions).toBe(DIMENSION_DEFINITIONS)
    expect(result.domainSlug).toBeNull()
    expect(result.domainLabel).toBeNull()
  })

  it('suma de pesos de TD es exactamente 1.0', () => {
    const totalWeight = TD_DIMENSION_DEFINITIONS.reduce(
      (sum, dim) => sum + dim.weight,
      0
    )

    expect(totalWeight).toBeCloseTo(1.0, 10)
  })

  it('TD tiene exactamente 6 dimensiones', () => {
    expect(TD_DIMENSION_DEFINITIONS).toHaveLength(6)
  })

  it('TD tiene exactamente 24 subdimensiones (4 por dimensión)', () => {
    const totalSubdimensions = TD_DIMENSION_DEFINITIONS.reduce(
      (sum, dim) => sum + dim.subdimensions.length,
      0
    )

    expect(totalSubdimensions).toBe(24)

    // Verificar que cada dimensión tiene exactamente 4
    for (const dim of TD_DIMENSION_DEFINITIONS) {
      expect(dim.subdimensions).toHaveLength(4)
    }
  })

  it('todos los códigos de subdimensión TD tienen prefijo td-', () => {
    for (const dim of TD_DIMENSION_DEFINITIONS) {
      for (const sub of dim.subdimensions) {
        expect(sub.code).toMatch(/^td-/)
      }
    }
  })
})
