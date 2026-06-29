import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock de Supabase — antes de cualquier import que lo use ──────
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signOut:            vi.fn(),
      getSession:         vi.fn(),
      onAuthStateChange:  vi.fn(),
    },
    from:      vi.fn(),
    functions: { invoke: vi.fn().mockResolvedValue({ data: {}, error: null }) },
  },
}))

// ── Mock de reportError para evitar Sentry en tests ──────────────
vi.mock('@/lib/reportError', () => ({
  reportError: vi.fn(),
}))

// ── Mock de todos los stores que el Auth store resetea en logout ──
vi.mock('@/modules/T1_MaturityRadar/store',     () => ({ useT1Store:    { getState: vi.fn(() => ({ reset: vi.fn() })) } }))
vi.mock('@/modules/T2_StakeholderMatrix/store', () => ({ useT2Store:    { getState: vi.fn(() => ({ reset: vi.fn() })) } }))
vi.mock('@/modules/T3_ValueStreamMap/store',    () => ({ useT3Store:    { getState: vi.fn(() => ({ reset: vi.fn() })) } }))
vi.mock('@/modules/T4_UseCasePriorityBoard/store', () => ({ useT4Store: { setState: vi.fn() } }))
vi.mock('@/modules/T5_AITaxonomyCanvas/store',  () => ({ useT5Store:    { getState: vi.fn(() => ({ syncEngagement: vi.fn() })) } }))
vi.mock('@/modules/T6_RiskGovernance/store',    () => ({ useT6Store:    { getState: vi.fn(() => ({ syncEngagement: vi.fn() })) } }))
vi.mock('@/modules/T7_AdoptionHeatmap/store',   () => ({ useT7Store:    { getState: vi.fn(() => ({ clearGeneratedPlan: vi.fn() })) } }))
vi.mock('@/modules/T8_CommunicationMap/store',  () => ({ useT8Store:    { getState: vi.fn(() => ({ clearGeneratedContent: vi.fn() })) } }))
vi.mock('@/modules/T9_AIRoadmap/store',         () => ({ useT9Store:    { getState: vi.fn(() => ({ syncEngagement: vi.fn() })) } }))
vi.mock('@/modules/T12_ISOAssessment/store',    () => ({ useT12Store:   { getState: vi.fn(() => ({ resetAll: vi.fn() })) } }))
vi.mock('@/modules/CompanyProfile/store',       () => ({ useCompanyProfileStore: { getState: vi.fn(() => ({ resetProfile: vi.fn() })) } }))
vi.mock('@/modules/Engagement/store',           () => ({ useEngagementStore:     { getState: vi.fn(() => ({ reset: vi.fn() })) } }))

import { supabase }       from '@/lib/supabase'
import { useAuthStore }   from '@/modules/Auth/store'
import type { AuthUser }  from '@/modules/Auth/types'

// ── Helpers ───────────────────────────────────────────────────────

const PROFILE_ROW = {
  id:    'user-abc',
  email: 'carlos@goby.ai',
  name:  'Carlos Sánchez',
  role:  'superadmin' as AuthUser['role'],
}

function mockProfileQuery(data: typeof PROFILE_ROW | null, error: { message: string } | null = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq:     vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  vi.mocked(supabase.from).mockReturnValue(chain as never)
}

function resetStore() {
  useAuthStore.setState({
    isAuthenticated:      false,
    isInitializing:       false,
    needsPasswordUpdate:  false,
    user:                 null,
    error:                null,
    sessionRecoveryState: 'idle',
  })
}

// ── login — credenciales correctas ────────────────────────────────

describe('useAuthStore.login — credenciales correctas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('retorna true y hidrata user con el perfil cargado', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data:  { user: { id: 'user-abc' }, session: {} },
      error: null,
    } as never)
    mockProfileQuery(PROFILE_ROW)

    const result = await useAuthStore.getState().login('carlos@goby.ai', 'secret')

    expect(result).toBe(true)
    const { user, isAuthenticated, error } = useAuthStore.getState()
    expect(isAuthenticated).toBe(true)
    expect(error).toBeNull()
    expect(user?.id).toBe('user-abc')
    expect(user?.role).toBe('superadmin')
    expect(user?.name).toBe('Carlos Sánchez')
  })

  it('normaliza el email a minúsculas antes de llamar signInWithPassword', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data:  { user: { id: 'user-abc' }, session: {} },
      error: null,
    } as never)
    mockProfileQuery(PROFILE_ROW)

    await useAuthStore.getState().login('CARLOS@GOBY.AI', 'secret')

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'carlos@goby.ai' }),
    )
  })
})

// ── login — credenciales incorrectas ─────────────────────────────

describe('useAuthStore.login — credenciales incorrectas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('retorna false y pone error en el store si Supabase retorna error', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data:  { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    } as never)

    const result = await useAuthStore.getState().login('x@x.com', 'wrong')

    expect(result).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().error).toBeTruthy()
  })

  it('retorna false si el perfil no existe en profiles (trigger falló)', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data:  { user: { id: 'user-orphan' }, session: {} },
      error: null,
    } as never)
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never)
    mockProfileQuery(null, { message: 'no rows' })

    const result = await useAuthStore.getState().login('orphan@goby.ai', 'pass')

    expect(result).toBe(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().error).toBeTruthy()
    expect(supabase.auth.signOut).toHaveBeenCalledOnce()
  })
})

// ── Resolución de rol ─────────────────────────────────────────────

describe('resolución de rol desde el store', () => {
  beforeEach(() => resetStore())

  it('superadmin: user.role es superadmin', () => {
    useAuthStore.setState({ user: { ...PROFILE_ROW, role: 'superadmin' }, isAuthenticated: true })
    expect(useAuthStore.getState().user?.role).toBe('superadmin')
  })

  it('consultant: user.role es consultant', () => {
    useAuthStore.setState({ user: { ...PROFILE_ROW, role: 'consultant' }, isAuthenticated: true })
    expect(useAuthStore.getState().user?.role).toBe('consultant')
  })

  it('client_editor: user.role es client_editor', () => {
    useAuthStore.setState({ user: { ...PROFILE_ROW, role: 'client_editor' }, isAuthenticated: true })
    expect(useAuthStore.getState().user?.role).toBe('client_editor')
  })

  it('client_viewer: user.role es client_viewer', () => {
    useAuthStore.setState({ user: { ...PROFILE_ROW, role: 'client_viewer' }, isAuthenticated: true })
    expect(useAuthStore.getState().user?.role).toBe('client_viewer')
  })

  it('sin usuario autenticado: user es null', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false })
    expect(useAuthStore.getState().user).toBeNull()
  })
})

// ── logout ────────────────────────────────────────────────────────

describe('useAuthStore.logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('llama a supabase.auth.signOut y limpia el estado', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never)
    useAuthStore.setState({ user: { ...PROFILE_ROW, role: 'superadmin' }, isAuthenticated: true })

    await useAuthStore.getState().logout()

    expect(supabase.auth.signOut).toHaveBeenCalledOnce()
    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })
})

// ── clearError / clearPasswordUpdate / clearSessionExpired ────────

describe('useAuthStore — acciones de limpieza', () => {
  beforeEach(() => resetStore())

  it('clearError → error queda null', () => {
    useAuthStore.setState({ error: 'Algo salió mal' })
    useAuthStore.getState().clearError()
    expect(useAuthStore.getState().error).toBeNull()
  })

  it('clearPasswordUpdate → needsPasswordUpdate queda false', () => {
    useAuthStore.setState({ needsPasswordUpdate: true })
    useAuthStore.getState().clearPasswordUpdate()
    expect(useAuthStore.getState().needsPasswordUpdate).toBe(false)
  })

  it('clearSessionExpired → sessionRecoveryState queda idle', () => {
    useAuthStore.setState({ sessionRecoveryState: 'expired' })
    useAuthStore.getState().clearSessionExpired()
    expect(useAuthStore.getState().sessionRecoveryState).toBe('idle')
  })
})
