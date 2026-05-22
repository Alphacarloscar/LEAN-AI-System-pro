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
import { useT1Store }    from '@/modules/T1_MaturityRadar/store'
import { useT2Store }    from '@/modules/T2_StakeholderMatrix/store'
import { useT3Store }    from '@/modules/T3_ValueStreamMap/store'
import { useT4Store }    from '@/modules/T4_UseCasePriorityBoard/store'
import { useT5Store }    from '@/modules/T5_AITaxonomyCanvas/store'
import { useT6Store }    from '@/modules/T6_RiskGovernance/store'
import { useT7Store }    from '@/modules/T7_AdoptionHeatmap/store'
import { useT8Store }    from '@/modules/T8_CommunicationMap/store'
import { useT9Store }    from '@/modules/T9_AIRoadmap/store'
import { useT12Store }   from '@/modules/T12_ISOAssessment/store'
import { useCompanyProfileStore } from '@/modules/CompanyProfile/store'
import { useEngagementStore }     from '@/modules/Engagement/store'

interface AuthStore {
  isAuthenticated:     boolean
  isInitializing:      boolean    // true mientras se comprueba la sesión al arrancar
  needsPasswordUpdate: boolean    // true cuando el usuario debe establecer contraseña
  user:                AuthUser | null
  error:               string | null

  // Llamar una vez al montar App — restaura sesión existente
  initialize:          () => Promise<void>
  // Devuelve true si login correcto, false si credenciales incorrectas
  login:               (email: string, password: string) => Promise<boolean>
  logout:              () => Promise<void>
  clearError:          () => void
  // Llamar desde ResetPasswordView tras actualizar contraseña con éxito
  clearPasswordUpdate: () => void
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
  isAuthenticated:     false,
  isInitializing:      true,
  needsPasswordUpdate: false,
  user:                null,
  error:               null,

  // ── initialize ───────────────────────────────────────────────
  // Comprueba si hay sesión activa en Supabase (cookie/localStorage).
  // App.tsx la llama en useEffect al montar — sin ella, el refresh
  // de página siempre redirige a /login aunque el token sea válido.
  initialize: async () => {
    set({ isInitializing: true })

    const { data: { session } } = await supabase.auth.getSession()

    if (session?.user) {
      const profile      = await loadProfile(session.user.id)
      // Si el metadato needs_password_reset=true, el usuario fue invitado y aún
      // no ha fijado su contraseña → forzar a /reset-password via ProtectedRoute.
      const needsReset   = session.user.user_metadata?.needs_password_reset === true
      set({
        isAuthenticated:     !!profile,
        user:                profile,
        needsPasswordUpdate: needsReset,
        isInitializing:      false,
      })
    } else {
      set({ isAuthenticated: false, user: null, isInitializing: false })
    }

    // Listener de cambios de sesión (token refresh, sign out en otra pestaña, etc.)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Flujo "olvidé contraseña" — forzar a /reset-password.
        set({ needsPasswordUpdate: true })
      }
      if (event === 'SIGNED_IN' && session?.user) {
        const profile    = await loadProfile(session.user.id)
        // Invitation sign-in: el metadato needs_password_reset marca primer acceso.
        const needsReset = session.user.user_metadata?.needs_password_reset === true
        set({ isAuthenticated: !!profile, user: profile, needsPasswordUpdate: needsReset })
      }
      if (event === 'SIGNED_OUT') {
        set({ isAuthenticated: false, user: null })
        // Limpiar TODOS los stores con datos de cliente al cerrar sesión
        // F-01: completado — antes solo limpiaba T1, T2, T4
        useT1Store.getState().reset()
        useT2Store.getState().reset()
        useT3Store.getState().reset()
        useT4Store.setState({ useCases: [], engagementId: null })
        useT5Store.getState().syncEngagement(null)
        useT6Store.getState().syncEngagement(null)
        useT7Store.getState().clearGeneratedPlan()
        useT8Store.getState().clearGeneratedContent()
        useT9Store.getState().syncEngagement(null)
        useT12Store.getState().resetAll()
        useCompanyProfileStore.getState().resetProfile()
        useEngagementStore.getState().reset()
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

  clearError:          () => set({ error: null }),
  clearPasswordUpdate: () => set({ needsPasswordUpdate: false }),
}))
