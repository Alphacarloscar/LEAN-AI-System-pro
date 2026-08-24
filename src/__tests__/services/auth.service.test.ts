import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/audit/auditClient', () => ({ fireAuditLog: vi.fn() }))
vi.mock('@/lib/audit', () => ({ makeAuditable: <T>(s: T) => s }))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}))

import { supabase } from '@/lib/supabase'
import {
  fetchProfile,
  getAuthUserCompanyId,
  getAuthSession,
  subscribeToAuthChanges,
  signInWithPassword,
  signOut,
  resetPasswordForEmail,
  updateAuthUser,
} from '@/services/auth.service'

describe('auth.service', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('fetchProfile', () => {
    it('retorna el perfil del usuario si existe', async () => {
      const mockProfile = {
        id: 'user-001',
        email: 'user@example.com',
        name: 'Test User',
        role: 'client_editor' as const,
      }

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchProfile('user-001')

      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(mockChain.select).toHaveBeenCalledWith('id, email, name, role')
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'user-001')
      expect(result).toEqual(mockProfile)
    })

    it('retorna null si el usuario no existe (error o data nula)', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchProfile('nonexistent')
      expect(result).toBeNull()
    })

    it('retorna null si Supabase retorna error', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('connection error') }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await fetchProfile('user-001')
      expect(result).toBeNull()
    })
  })

  describe('getAuthUserCompanyId', () => {
    it('retorna company_id del usuario autenticado', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-001' } as never },
        error: null,
      })

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: 'comp-123' },
          error: null,
        }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await getAuthUserCompanyId()

      expect(supabase.auth.getUser).toHaveBeenCalledOnce()
      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(result).toBe('comp-123')
    })

    it('retorna undefined si no hay usuario autenticado', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await getAuthUserCompanyId()
      expect(result).toBeUndefined()
    })

    it('retorna undefined si no hay company_id en el perfil', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-001' } as never },
        error: null,
      })

      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { company_id: null },
          error: null,
        }),
      }

      vi.mocked(supabase.from).mockReturnValue(mockChain as never)

      const result = await getAuthUserCompanyId()
      expect(result).toBeUndefined()
    })
  })

  describe('getAuthSession', () => {
    it('delega a supabase.auth.getSession', async () => {
      const mockSession = { user: { id: 'user-001' } }
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as never },
        error: null,
      })

      const result = await getAuthSession()

      expect(supabase.auth.getSession).toHaveBeenCalledOnce()
      expect(result.data?.session).toBe(mockSession)
    })
  })

  describe('subscribeToAuthChanges', () => {
    it('retorna un objeto subscription con unsubscribe', () => {
      const mockUnsubscribe = vi.fn()
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      } as never)

      const callback = vi.fn()
      const result = subscribeToAuthChanges(callback)

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(callback)
      expect(result).toBeDefined()
    })
  })

  describe('signInWithPassword', () => {
    it('delega a supabase.auth.signInWithPassword', async () => {
      const mockUser = { id: 'user-001', email: 'user@example.com' }
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser as never, session: null },
        error: null,
      })

      const result = await signInWithPassword('user@example.com', 'password123')

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password123',
      })
      expect(result.data?.user).toBe(mockUser)
    })
  })

  describe('signOut', () => {
    it('delega a supabase.auth.signOut', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

      await signOut()

      expect(supabase.auth.signOut).toHaveBeenCalledOnce()
    })
  })

  describe('resetPasswordForEmail', () => {
    it('llama a supabase.auth.resetPasswordForEmail sin opciones', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ error: null })

      await resetPasswordForEmail('user@example.com')

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', undefined)
    })

    it('pasa opciones redirectTo si se proporcionan', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({ error: null })

      await resetPasswordForEmail('user@example.com', { redirectTo: 'https://example.com/reset' })

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
        redirectTo: 'https://example.com/reset',
      })
    })
  })

  describe('updateAuthUser', () => {
    it('actualiza la contraseña del usuario', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: {} as never },
        error: null,
      })

      await updateAuthUser({ password: 'newpassword123' })

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
    })

    it('actualiza user_metadata', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: {} as never },
        error: null,
      })

      await updateAuthUser({ data: { theme: 'dark' } })

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        data: { theme: 'dark' },
      })
    })

    it('actualiza ambos: password + metadata', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: {} as never },
        error: null,
      })

      await updateAuthUser({ password: 'new', data: { lang: 'es' } })

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'new',
        data: { lang: 'es' },
      })
    })
  })
})
