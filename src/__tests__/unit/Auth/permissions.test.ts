import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock del store de auth — debe ir antes del import del hook
vi.mock('@/modules/Auth/store', () => ({
  useAuthStore: vi.fn(),
}))

import { useAuthStore } from '@/modules/Auth/store'
import { usePermissions } from '@/modules/Auth/usePermissions'
import type { AuthUser } from '@/modules/Auth/types'

// ── Helper ────────────────────────────────────────────────────

function mockUser(role: AuthUser['role']): AuthUser {
  return { id: 'user-123', email: 'test@goby.ai', name: 'Test User', role }
}

function setupStore(user: AuthUser | null) {
  vi.mocked(useAuthStore).mockReturnValue({ user } as ReturnType<typeof useAuthStore>)
}

// ── usePermissions ────────────────────────────────────────────

describe('usePermissions — isReadOnly', () => {
  beforeEach(() => vi.clearAllMocks())

  it('client_viewer → isReadOnly = true', () => {
    setupStore(mockUser('client_viewer'))
    const { isReadOnly } = usePermissions()
    expect(isReadOnly).toBe(true)
  })

  it('client_editor → isReadOnly = false', () => {
    setupStore(mockUser('client_editor'))
    const { isReadOnly } = usePermissions()
    expect(isReadOnly).toBe(false)
  })

  it('consultant → isReadOnly = false', () => {
    setupStore(mockUser('consultant'))
    const { isReadOnly } = usePermissions()
    expect(isReadOnly).toBe(false)
  })

  it('superadmin → isReadOnly = false', () => {
    setupStore(mockUser('superadmin'))
    const { isReadOnly } = usePermissions()
    expect(isReadOnly).toBe(false)
  })

  it('user null (no autenticado) → isReadOnly = false', () => {
    setupStore(null)
    const { isReadOnly } = usePermissions()
    expect(isReadOnly).toBe(false)
  })
})

describe('usePermissions — canEditCompanySettings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('superadmin → canEditCompanySettings = true', () => {
    setupStore(mockUser('superadmin'))
    const { canEditCompanySettings } = usePermissions()
    expect(canEditCompanySettings).toBe(true)
  })

  it('consultant → canEditCompanySettings = true', () => {
    setupStore(mockUser('consultant'))
    const { canEditCompanySettings } = usePermissions()
    expect(canEditCompanySettings).toBe(true)
  })

  it('client_editor → canEditCompanySettings = false', () => {
    setupStore(mockUser('client_editor'))
    const { canEditCompanySettings } = usePermissions()
    expect(canEditCompanySettings).toBe(false)
  })

  it('client_viewer → canEditCompanySettings = false', () => {
    setupStore(mockUser('client_viewer'))
    const { canEditCompanySettings } = usePermissions()
    expect(canEditCompanySettings).toBe(false)
  })

  it('user null → canEditCompanySettings = false', () => {
    setupStore(null)
    const { canEditCompanySettings } = usePermissions()
    expect(canEditCompanySettings).toBe(false)
  })
})
