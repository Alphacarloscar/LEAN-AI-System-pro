import { describe, it, expect } from 'vitest'

// engagements.service.ts is a compatibility re-export of projects.service.ts (deprecated Sprint 8).
// This test verifies the re-export contract: all public exports from projects.service
// must be accessible via engagements.service.
describe('engagements.service — re-export contract', () => {
  it('exports the same symbols as projects.service', async () => {
    const engagementsModule = await import('@/services/engagements.service')
    const projectsModule    = await import('@/services/projects.service')

    const engKeys  = Object.keys(engagementsModule).sort()
    const projKeys = Object.keys(projectsModule).sort()

    expect(engKeys).toEqual(projKeys)
  })

  it('each exported function is callable (not undefined)', async () => {
    const mod = await import('@/services/engagements.service')
    for (const [key, value] of Object.entries(mod)) {
      expect(
        value,
        `engagements.service export "${key}" should not be undefined`,
      ).toBeDefined()
    }
  })
})
