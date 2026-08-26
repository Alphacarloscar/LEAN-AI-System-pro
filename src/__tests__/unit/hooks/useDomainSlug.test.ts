// ============================================================
// useDomainSlug — Tests
//
// Validates that useDomainSlug reads from already-loaded
// useEngagementStore without firing additional queries.
// ============================================================

import { describe, it, expect, vi } from 'vitest'
import { useDomainSlug } from '@/hooks/useDomainSlug'
import { useEngagementStore } from '@/modules/Engagement/store'

// ── Mocks ────────────────────────────────────────────────────

vi.mock('@/modules/Engagement/store')

// ── Tests ────────────────────────────────────────────────────

describe('useDomainSlug', () => {
  const mockUseEngagementStore = vi.mocked(useEngagementStore)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna domainId, domainSlug, domainLabel del proyecto activo', () => {
    mockUseEngagementStore.mockImplementation((selector: any) => {
      const state = {
        projects: [
          {
            id: 'project-1',
            governance_domains: {
              id: 'domain-ai-1',
              slug: 'ai_adoption',
              label: 'AI Adoption',
            },
          } as any,
        ],
        activeEngagementId: 'project-1',
      }

      return selector(state)
    })

    const result = useDomainSlug()

    expect(result.domainId).toBe('domain-ai-1')
    expect(result.domainSlug).toBe('ai_adoption')
    expect(result.domainLabel).toBe('AI Adoption')
  })

  it('retorna domainId, domainSlug, domainLabel para transformacion_digital', () => {
    mockUseEngagementStore.mockImplementation((selector: any) => {
      const state = {
        projects: [
          {
            id: 'project-2',
            governance_domains: {
              id: 'domain-td-1',
              slug: 'transformacion_digital',
              label: 'Transformación Digital',
            },
          } as any,
        ],
        activeEngagementId: 'project-2',
      }

      return selector(state)
    })

    const result = useDomainSlug()

    expect(result.domainId).toBe('domain-td-1')
    expect(result.domainSlug).toBe('transformacion_digital')
    expect(result.domainLabel).toBe('Transformación Digital')
  })

  it('retorna null valores si activeEngagementId es null', () => {
    mockUseEngagementStore.mockImplementation((selector: any) => {
      const state = {
        projects: [],
        activeEngagementId: null,
      }

      return selector(state)
    })

    const result = useDomainSlug()

    expect(result.domainId).toBeNull()
    expect(result.domainSlug).toBeNull()
    expect(result.domainLabel).toBeNull()
  })

  it('retorna null valores si proyecto no tiene governance_domains', () => {
    mockUseEngagementStore.mockImplementation((selector: any) => {
      const state = {
        projects: [
          {
            id: 'project-3',
            governance_domains: null,
          } as any,
        ],
        activeEngagementId: 'project-3',
      }

      return selector(state)
    })

    const result = useDomainSlug()

    expect(result.domainId).toBeNull()
    expect(result.domainSlug).toBeNull()
    expect(result.domainLabel).toBeNull()
  })

  it('retorna null valores si projects array está vacío', () => {
    mockUseEngagementStore.mockImplementation((selector: any) => {
      const state = {
        projects: [],
        activeEngagementId: 'project-not-found',
      }

      return selector(state)
    })

    const result = useDomainSlug()

    expect(result.domainId).toBeNull()
    expect(result.domainSlug).toBeNull()
    expect(result.domainLabel).toBeNull()
  })

  it('no dispara queries adicionales — lee solo del array projects cargado', () => {
    const selectorSpy = vi.fn()
    mockUseEngagementStore.mockImplementation((selector: any) => {
      selectorSpy()
      const state = {
        projects: [
          {
            id: 'project-4',
            governance_domains: {
              id: 'domain-1',
              slug: 'ai_adoption',
              label: 'AI Adoption',
            },
          } as any,
        ],
        activeEngagementId: 'project-4',
      }

      return selector(state)
    })

    useDomainSlug()

    // Debe ser 2 calls: uno por projects, uno por activeEngagementId
    // (el hook llama al store dos veces, una por cada selector)
    expect(selectorSpy).toHaveBeenCalledTimes(2)
  })
})
