import { describe, it, expect } from 'vitest'
import { getSegment, SEGMENT_ORDER, ARCHETYPE_BASE_SEG } from '@/modules/T7_AdoptionHeatmap/T7Constants'
import type { ResistanceLevel } from '@/modules/T2_StakeholderMatrix/types'

describe('getSegment (Rogers segment assignment)', () => {
  describe('known archetypes without resistance alta', () => {
    it('adoptador + baja → early_adopters', () => {
      expect(getSegment('adoptador', 'baja')).toBe('early_adopters')
    })

    it('adoptador + media → early_adopters', () => {
      expect(getSegment('adoptador', 'media')).toBe('early_adopters')
    })

    it('ambassador + baja → early_majority', () => {
      expect(getSegment('ambassador', 'baja')).toBe('early_majority')
    })

    it('ambassador + media → early_majority', () => {
      expect(getSegment('ambassador', 'media')).toBe('early_majority')
    })

    it('decisor + baja → early_majority', () => {
      expect(getSegment('decisor', 'baja')).toBe('early_majority')
    })

    it('decisor + media → early_majority', () => {
      expect(getSegment('decisor', 'media')).toBe('early_majority')
    })

    it('reticente + baja → late_majority', () => {
      expect(getSegment('reticente', 'baja')).toBe('late_majority')
    })

    it('reticente + media → late_majority', () => {
      expect(getSegment('reticente', 'media')).toBe('late_majority')
    })

    it('especialista + baja → late_majority (compat legacy)', () => {
      expect(getSegment('especialista', 'baja')).toBe('late_majority')
    })

    it('especialista + media → late_majority (compat legacy)', () => {
      expect(getSegment('especialista', 'media')).toBe('late_majority')
    })

    it('critico + baja → laggards', () => {
      expect(getSegment('critico', 'baja')).toBe('laggards')
    })

    it('critico + media → laggards', () => {
      expect(getSegment('critico', 'media')).toBe('laggards')
    })
  })

  describe('known archetypes with resistance alta (advance 1 position)', () => {
    it('adoptador + alta → avanza desde early_adopters → early_majority', () => {
      expect(getSegment('adoptador', 'alta')).toBe('early_majority')
    })

    it('ambassador + alta → avanza desde early_majority → early_majority (clamp al mismo)', () => {
      expect(getSegment('ambassador', 'alta')).toBe('late_majority')
    })

    it('decisor + alta → avanza desde early_majority → late_majority', () => {
      expect(getSegment('decisor', 'alta')).toBe('late_majority')
    })

    it('reticente + alta → avanza desde late_majority → laggards', () => {
      expect(getSegment('reticente', 'alta')).toBe('laggards')
    })

    it('especialista + alta → avanza desde late_majority → laggards (compat)', () => {
      expect(getSegment('especialista', 'alta')).toBe('laggards')
    })

    it('critico + alta → intenta avanzar desde laggards (último) → clamp a laggards', () => {
      expect(getSegment('critico', 'alta')).toBe('laggards')
    })
  })

  describe('unknown archetype fallback', () => {
    it('unknown archetype + baja → fallback early_majority', () => {
      expect(getSegment('no_existe', 'baja')).toBe('early_majority')
    })

    it('unknown archetype + media → fallback early_majority', () => {
      expect(getSegment('unknown_type', 'media')).toBe('early_majority')
    })

    it('unknown archetype + alta → fallback early_majority, avanza a late_majority', () => {
      expect(getSegment('mystery', 'alta')).toBe('late_majority')
    })
  })

  describe('segment order and index boundaries', () => {
    it('SEGMENT_ORDER es [innovators, early_adopters, early_majority, late_majority, laggards]', () => {
      expect(SEGMENT_ORDER).toEqual([
        'innovators',
        'early_adopters',
        'early_majority',
        'late_majority',
        'laggards',
      ])
    })

    it('no puede avanzar más allá de laggards (clamped al índice máximo)', () => {
      // critico es laggards (índice 4), avanzar sería índice 5 (no existe)
      // Math.min(4 + 1, 4) = 4 → laggards
      expect(getSegment('critico', 'alta')).toBe('laggards')
    })
  })

  describe('archetype base mapping consistency', () => {
    it('ARCHETYPE_BASE_SEG contiene todas las claves esperadas', () => {
      expect(ARCHETYPE_BASE_SEG).toHaveProperty('adoptador')
      expect(ARCHETYPE_BASE_SEG).toHaveProperty('ambassador')
      expect(ARCHETYPE_BASE_SEG).toHaveProperty('decisor')
      expect(ARCHETYPE_BASE_SEG).toHaveProperty('reticente')
      expect(ARCHETYPE_BASE_SEG).toHaveProperty('especialista')
      expect(ARCHETYPE_BASE_SEG).toHaveProperty('critico')
    })

    it('cada valor base está en SEGMENT_ORDER', () => {
      Object.values(ARCHETYPE_BASE_SEG).forEach((seg) => {
        expect(SEGMENT_ORDER).toContain(seg)
      })
    })
  })

  describe('resistance level enum coverage', () => {
    it('baja: sin avance', () => {
      const resistances: ResistanceLevel[] = ['baja']
      resistances.forEach((r) => {
        expect(getSegment('adoptador', r)).toBe(ARCHETYPE_BASE_SEG['adoptador'])
      })
    })

    it('media: sin avance', () => {
      const resistances: ResistanceLevel[] = ['media']
      resistances.forEach((r) => {
        expect(getSegment('adoptador', r)).toBe(ARCHETYPE_BASE_SEG['adoptador'])
      })
    })

    it('alta: con avance', () => {
      const base = SEGMENT_ORDER.indexOf(ARCHETYPE_BASE_SEG['adoptador'])
      const expected = SEGMENT_ORDER[Math.min(base + 1, SEGMENT_ORDER.length - 1)]
      expect(getSegment('adoptador', 'alta')).toBe(expected)
    })
  })
})
