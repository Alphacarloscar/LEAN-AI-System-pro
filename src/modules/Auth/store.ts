// ============================================================
// Auth — Zustand store con persist
//
// MVP: valida contra MVP_CREDENTIALS.
// Sprint 3+: reemplazar login() por supabase.auth.signInWithPassword()
// ============================================================

import { create }          from 'zustand'
import { persist }         from 'zustand/middleware'
import type { AuthUser }   from './types'
import { MVP_CREDENTIALS } from './types'

interface AuthStore {
  isAuthenticated: boolean
  user:            AuthUser | null
  error:           string | null
  // Actions
  login:  (email: string, password: string) => boolean
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user:            null,
      error:           null,

      login: (email, password) => {
        const found = MVP_CREDENTIALS.find(
          (c) =>
            c.email.toLowerCase() === email.toLowerCase().trim() &&
            c.password === password
        )
        if (found) {
          set({ isAuthenticated: true, user: found.user, error: null })
          return true
        }
        set({ error: 'Credenciales incorrectas. Verifica tu email y contraseña.' })
        return false
      },

      logout: () => {
        set({ isAuthenticated: false, user: null, error: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name:    'lean-auth',
      version: 1,
      // Solo persistir el estado de sesión, no las acciones
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user:            state.user,
      }),
    }
  )
)
