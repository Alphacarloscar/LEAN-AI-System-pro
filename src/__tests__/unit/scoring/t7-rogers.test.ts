// ============================================================
// t7-rogers.test.ts — Tests de asignación de segmento Rogers (T7)
// ============================================================

import { describe, it, expect } from 'vitest'
import { getSegment, SEGMENT_ORDER, ARCHETYPE_BASE_SEG } from '@/modules/T7_AdoptionHeatmap/T7Constants'
import type { ResistanceLevel } from '@/types'

describe('T7 - Rogers Segment Assignment', () => {
  it('maps ADOPTADOR archetype to EARLY_ADOPTERS segment', () => {
    const segment = getSegment('adoptador', 'baja')
    expect(segment).toBe('early_adopters')
  })

  it('maps AMBASSADOR archetype to EARLY_MAJORITY segment', () => {
    const segment = getSegment('ambassador', 'baja')
    expect(segment).toBe('early_majority')
  })

  it('maps DECISOR archetype to EARLY_MAJORITY segment', () => {
    const segment = getSegment('decisor', 'baja')
    expect(segment).toBe('early_majority')
  })

  it('maps RETICENTE archetype to LATE_MAJORITY segment', () => {
    const segment = getSegment('reticente', 'baja')
    expect(segment).toBe('late_majority')
  })

  it('maps CRITICO archetype to LAGGARDS segment', () => {
    const segment = getSegment('critico', 'baja')
    expect(segment).toBe('laggards')
  })

  it('shifts archetype one segment right when resistance is ALTA', () => {
    // adoptador (early_adopters) + alta → early_majority
    const segment = getSegment('adoptador', 'alta')
    const baseIdx = SEGMENT_ORDER.indexOf('early_adopters')
    const expectedIdx = Math.min(baseIdx + 1, SEGMENT_ORDER.length - 1)
    expect(segment).toBe(SEGMENT_ORDER[expectedIdx])
    expect(segment).toBe('early_majority')
  })

  it('does not shift beyond LAGGARDS when resistance is ALTA', () => {
    // critico (laggards) + alta → stays at laggards (max)
    const segment = getSegment('critico', 'alta')
    expect(segment).toBe('laggards')
  })

  it('does not shift segment when resistance is MEDIA', () => {
    const segment = getSegment('adoptador', 'media')
    expect(segment).toBe('early_adopters')
  })

  it('does not shift segment when resistance is BAJA', () => {
    const segment = getSegment('ambassador', 'baja')
    expect(segment).toBe('early_majority')
  })

  it('handles unknown archetype with EARLY_MAJORITY fallback', () => {
    const segment = getSegment('unknown_archetype', 'baja')
    expect(segment).toBe('early_majority')
  })

  it('unknown archetype with ALTA resistance shifts to next segment', () => {
    const segment = getSegment('unknown_archetype', 'alta')
    const fallbackIdx = SEGMENT_ORDER.indexOf('early_majority')
    const expectedIdx = Math.min(fallbackIdx + 1, SEGMENT_ORDER.length - 1)
    expect(segment).toBe(SEGMENT_ORDER[expectedIdx])
  })

  it('all archetipos are defined in ARCHETYPE_BASE_SEG', () => {
    const allArchetypes = ['adoptador', 'ambassador', 'decisor', 'reticente', 'critico']
    allArchetypes.forEach((arch) => {
      expect(ARCHETYPE_BASE_SEG[arch]).toBeDefined()
      expect(SEGMENT_ORDER).toContain(ARCHETYPE_BASE_SEG[arch])
    })
  })

  it('SEGMENT_ORDER has correct Rogers diffusion order', () => {
    expect(SEGMENT_ORDER).toEqual([
      'innovators',
      'early_adopters',
      'early_majority',
      'late_majority',
      'laggards',
    ])
  })

  it('segment shifting logic respects boundaries', () => {
    // Test all archetipos with alta resistance to ensure no out-of-bounds
    const allArchetypes = Object.keys(ARCHETYPE_BASE_SEG)
    allArchetypes.forEach((arch) => {
      const segment = getSegment(arch, 'alta')
      expect(SEGMENT_ORDER).toContain(segment)
    })
  })

  it('resistance ALTA shifts specialist legacy archetype correctly', () => {
    // especialista es un archetype antiguo en localStorage que mapea a late_majority
    const segment = getSegment('especialista', 'alta')
    const baseIdx = SEGMENT_ORDER.indexOf('late_majority')
    const expectedIdx = Math.min(baseIdx + 1, SEGMENT_ORDER.length - 1)
    expect(segment).toBe(SEGMENT_ORDER[expectedIdx])
  })
})
