// ============================================================
// Auth — Zustand store con Supabase Auth
//
// Sprint 3: reemplaza MVP credentials por Supabase Auth real.
//
// Flujo de sesión:
//   1. initialize() — llamado en App boot, restaura sesión existente.
//   2. login()      — signInWithPassword → carga perfil → hydrata store.
//   3. logout()     — signOut → limpia store.
//
// Supabase escucha cambios de sesión vía onAuthStateChange.
// El store siempre refleja el estado real de la sesión.
// ============================================================

import { create }        from 'zustand'
import { supabase }      from '@/lib/supabase'
import type { AuthUser } from './types'

interface AuthStore {
  isAuthenticated: boolean
  isInitializing:  boolean    // true mientras se comprueba la sesión al arrancar
  user:            AuthUser | null
  error:           string | null

  // Llamar una vez al montar App — restaura sesión existente
  initialize:  () => Promise<void>
  // Devuelve true si login correcto, false si credenciales incorrectas
  login:       (email: string, password: string) => Promise<boolean>
  logout:      () => Promise<void>
  clearError:  () => void
}

// ── Helper: carga el perfil extendido desde la tabla profiles ──

async function loadProfile(userId: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  return {
    id:    data.id,
    email: data.email,
    name:  data.name,
    role:  data.role as AuthUser['role'],
  }
}

// ── Store ──────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()((set) => ({
  isAuthenticated: false,
  isInitializing:  true,
  user:            null,
  error:           null,

  // ── initialize ───────────────────────────────────────────────
  // Comprueba si hay sesión activa en Supabase (cookie/localStorage).
  // App.tsx la llama en useEffect al montar — sin ella, el refresh
  // de página siempre redirige a /login aunque el token sea válido.
  initialize: async () => {
    set({ isInitializing: true })

    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      const profile = await loadProfile(session.user.id)
      set({
        isAuthenticated: !!profile,
        user:            profile,
        isInitializing:  false,
      })
    } else {
      set({ isAuthenticated: false, user: null, isInitializing: false })
    }

    // Listener de cambios de sesión (token refresh, sign out en otra pestaña, etc.)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await loadProfile(session.user.id)
        set({ isAuthenticated: !!profile, user: profile })
      }
      if (event === 'SIGNED_OUT') {
        set({ isAuthenticated: false, user: null })
      }
      if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Sesión renovada automáticamente — no necesitamos hacer nada
      }
    })
  },

  // ── login ────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ error: null })

    const { data, error } = await supabase.auth.signInWithPassword({
      email:    email.toLowerCase().trim(),
      password,
    })

    if (error || !data.user) {
      console.error('[login] AUTH ERROR:', {
        message: error?.message,
        status:  error?.status,
        code:    (error as any)?.code,
        email:   email.toLowerCase().trim(),
      })
      set({ error: 'Credenciales incorrectas. Verifica tu email y contraseña.' })
      return false
    }

    const profile = await loadProfile(data.user.id)

    if (!profile) {
      // Usuario existe en auth pero no tiene perfil en profiles
      // Puede ocurrir si el trigger handle_new_user falló
      set({ error: 'Perfil de usuario no encontrado. Contacta con el administrador.' })
      await supabase.auth.signOut()
      return false
    }

    set({ isAuthenticated: true, user: profile, error: null })
    return true
  },

  // ── logout ───────────────────────────────────────────────────
  logout: async () => {
    await supabase.auth.signOut()
    set({ isAuthenticated: false, user: null, error: null })
  },

  clearError: () => set({ error: null }),
}))
