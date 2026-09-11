import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/modules/Auth/store', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('@/modules/Engagement/store', () => ({
  useEngagementStore: vi.fn(),
}))

import { useAuthStore } from '@/modules/Auth/store'
import { useEngagementStore } from '@/modules/Engagement/store'
import {
  COMPANY_PROFILE_ROLE_PERMISSIONS,
  canAccessAdmin,
  getCompanyProfilePermissions,
  usePermissions,
} from '@/modules/Auth/usePermissions'
import type { AuthUser } from '@/modules/Auth/types'

function mockUser(role: AuthUser['role']): AuthUser {
  return { id: 'user-123', email: 'test@goby.ai', name: 'Test User', role }
}

function setupStore(user: AuthUser | null) {
  vi.mocked(useAuthStore).mockReturnValue({ user } as ReturnType<typeof useAuthStore>)
  vi.mocked(useEngagementStore).mockImplementation((selector) => {
    const state = { projects: [], activeEngagementId: null }
    const typedSelector = selector as (store: typeof state) => unknown
    return typedSelector(state) as ReturnType<typeof selector>
  })
}

describe('usePermissions - isReadOnly', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['client_viewer', true],
    ['client_editor', false],
    ['consultant', false],
    ['superadmin', false],
  ] as const)('%s maps isReadOnly to %s', (role, expected) => {
    setupStore(mockUser(role))
    expect(usePermissions().isReadOnly).toBe(expected)
  })

  it('anonymous users are not treated as read-only project users', () => {
    setupStore(null)
    expect(usePermissions().isReadOnly).toBe(false)
  })
})

describe('canAccessAdmin', () => {
  it.each([
    ['superadmin', true],
    ['consultant', false],
    ['client_editor', false],
    ['client_viewer', false],
    [null, false],
  ] as const)('%s role returns %s', (role, expected) => {
    expect(canAccessAdmin(role)).toBe(expected)
  })
})

describe('getCompanyProfilePermissions', () => {
  it('exposes a reusable action matrix for every role', () => {
    expect(COMPANY_PROFILE_ROLE_PERMISSIONS).toEqual({
      superadmin: {
        canViewCompanyProfile: true,
        canEditCompanyData: true,
        canManageOrganization: true,
        canManageContractedPlans: true,
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: true,
      },
      consultant: {
        canViewCompanyProfile: true,
        canEditCompanyData: true,
        canManageOrganization: true,
        canManageContractedPlans: false,
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: true,
      },
      client_editor: {
        canViewCompanyProfile: true,
        canEditCompanyData: false,
        canManageOrganization: false,
        canManageContractedPlans: false,
        canCreateProjects: true,
        canEditProjects: true,
        canDeleteProjects: false,
      },
      client_viewer: {
        canViewCompanyProfile: true,
        canEditCompanyData: false,
        canManageOrganization: false,
        canManageContractedPlans: false,
        canCreateProjects: false,
        canEditProjects: false,
        canDeleteProjects: false,
      },
    })
  })

  it('maps superadmin to every company profile action', () => {
    expect(getCompanyProfilePermissions('superadmin')).toEqual({
      canViewCompanyProfile: true,
      canEditCompanyData: true,
      canManageOrganization: true,
      canManageContractedPlans: true,
      canCreateProjects: true,
      canEditProjects: true,
      canDeleteProjects: true,
    })
  })

  it('maps consultant to operational actions but not contracted plans', () => {
    expect(getCompanyProfilePermissions('consultant')).toMatchObject({
      canViewCompanyProfile: true,
      canEditCompanyData: true,
      canManageOrganization: true,
      canManageContractedPlans: false,
      canCreateProjects: true,
      canEditProjects: true,
      canDeleteProjects: true,
    })
  })

  it('maps client_editor to functional project editing only', () => {
    expect(getCompanyProfilePermissions('client_editor')).toMatchObject({
      canViewCompanyProfile: true,
      canEditCompanyData: false,
      canManageOrganization: false,
      canManageContractedPlans: false,
      canCreateProjects: true,
      canEditProjects: true,
      canDeleteProjects: false,
    })
  })

  it('maps client_viewer and anonymous users to read-only access', () => {
    expect(getCompanyProfilePermissions('client_viewer')).toMatchObject({
      canViewCompanyProfile: true,
      canEditCompanyData: false,
      canManageOrganization: false,
      canManageContractedPlans: false,
      canCreateProjects: false,
      canEditProjects: false,
      canDeleteProjects: false,
    })
    expect(getCompanyProfilePermissions(null)).toMatchObject({
      canViewCompanyProfile: false,
      canEditCompanyData: false,
      canManageOrganization: false,
      canManageContractedPlans: false,
      canCreateProjects: false,
      canEditProjects: false,
      canDeleteProjects: false,
    })
  })
})

describe('usePermissions - company settings compatibility', () => {
  beforeEach(() => vi.clearAllMocks())

  it.each([
    ['superadmin', true],
    ['consultant', true],
    ['client_editor', false],
    ['client_viewer', false],
  ] as const)('%s maps canEditCompanySettings to %s', (role, expected) => {
    setupStore(mockUser(role))
    expect(usePermissions().canEditCompanySettings).toBe(expected)
  })

  it('anonymous users cannot edit company settings', () => {
    setupStore(null)
    expect(usePermissions().canEditCompanySettings).toBe(false)
  })
})
