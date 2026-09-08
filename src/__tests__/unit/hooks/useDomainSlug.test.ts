// ============================================================
// useDomainSlug — Tests
//
// Validates that useDomainSlug returns the default domain
// (ADR-029: proyectos ya no tienen domain_id, siempre es ai_adoption)
// ============================================================

import { describe, it, expect } from 'vitest'
import { useDomainSlug } from '@/hooks/useDomainSlug'

// ── Tests ────────────────────────────────────────────────────

describe('useDomainSlug', () => {
  it('retorna domainSlug ai_adoption (default)', () => {
    const result = useDomainSlug()

    expect(result.domainId).toBeNull()
    expect(result.domainSlug).toBe('ai_adoption')
    expect(result.domainLabel).toBe('AI Adoption')
  })

  it('siempre retorna el mismo valor (función pura)', () => {
    const result1 = useDomainSlug()
    const result2 = useDomainSlug()

    expect(result1).toEqual(result2)
    expect(result1.domainSlug).toBe('ai_adoption')
    expect(result2.domainSlug).toBe('ai_adoption')
  })

  it('retorna null domainId (sin domain_id en proyectos tras ADR-029)', () => {
    const result = useDomainSlug()

    expect(result.domainId).toBeNull()
  })
})
