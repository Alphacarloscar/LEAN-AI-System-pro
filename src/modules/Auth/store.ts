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
import { useCompanyProfileStore }  from '@/modules/CompanyProfile/store'
import { useEngagementStore }      from '@/modules/Engagement/store'
import { loadAllCriticalStores }   from '@/lib/resetEngagementStores'

// ── Módulo-nivel: subscription de auth y flags de control ────────────────────
// Una sola subscription activa por ciclo de vida de la app.
// _intentionalSignOut evita mostrar el overlay de sesión expirada en logouts normales.
// _isInitializing evita llamadas concurrentes a initialize() (StrictMode, hot-reload).
let _authSubscription:  { unsubscribe: () => void } | null = null
let _intentionalSignOut = false
let _isInitializing     = false

// ── Estado de recuperación de sesión ─────────────────────────────────────────
// 'idle'         — estado normal, sesión activa o no autenticado
// 'reconnecting' — sesión se recuperó tras expiración, recargando stores en BG
// 'expired'      — sesión expiró inesperadamente; mostrar overlay al usuario
export type SessionRecoveryState = 'idle' | 'reconnecting' | 'expired'

interface AuthStore {
  isAuthenticated:      boolean
  isInitializing:       boolean    // true mientras se comprueba la sesión al arrancar
  needsPasswordUpdate:  boolean    // true cuando el usuario debe establecer contraseña
  user:                 AuthUser | null
  error:                string | null
  /** Estado de recuperación de sesión — leído por SessionRecoveryBanner en AppLayout */
  sessionRecoveryState: SessionRecoveryState

  // Llamar una vez al montar App — restaura sesión existente
  initialize:           () => Promise<void>
  // Devuelve true si login correcto, false si credenciales incorrectas
  login:                (email: string, password: string) => Promise<boolean>
  logout:               () => Promise<void>
  clearError:           () => void
  // Llamar desde ResetPasswordView tras actualizar contraseña con éxito
  clearPasswordUpdate:  () => void
  // Limpia el overlay de sesión expirada (tras re-login exitoso)
  clearSessionExpired:  () => void
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
  isAuthenticated:      false,
  isInitializing:       true,
  needsPasswordUpdate:  false,
  user:                 null,
  error:                null,
  sessionRecoveryState: 'idle' as SessionRecoveryState,

  // ── initialize ───────────────────────────────────────────────
  // Comprueba si hay sesión activa en Supabase (cookie/localStorage).
  // App.tsx la llama en useEffect al montar — sin ella, el refresh
  // de página siempre redirige a /login aunque el token sea válido.
  //
  // Garantías de esta implementación:
  //   — Una sola subscription activa (unsubscribe antes de registrar de nuevo).
  //   — SIGNED_OUT inesperado → sessionRecoveryState: 'expired' (overlay al usuario).
  //   — SIGNED_OUT por logout() → no muestra overlay (_intentionalSignOut = true).
  //   — SIGNED_IN tras 'expired' → recarga silenciosa de stores + banner "Reconectando…"
  initialize: async () => {
    // Protección contra llamadas concurrentes (React StrictMode, hot-reload).
    // Si ya hay una inicialización en curso, ignorar la segunda llamada.
    if (_isInitializing) return
    _isInitializing = true

    set({ isInitializing: true })

    // Limpiar subscription previa antes de registrar una nueva.
    // Previene dobles listeners que compiten por el Web Lock de gotrue-js.
    if (_authSubscription) {
      _authSubscription.unsubscribe()
      _authSubscription = null
    }

    // Usamos onAuthStateChange como única fuente de verdad para la sesión inicial.
    // gotrue-js garantiza que INITIAL_SESSION se dispara sincrónicamente al registrar
    // el listener con la sesión actual — no necesitamos llamar getSession() por separado,
    // lo que elimina la contención del Web Lock que produce el warning de gotrue-js.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {

      if (event === 'INITIAL_SESSION') {
        // Primera hidratación: sesión existente o null (no autenticado)
        if (session?.user) {
          const profile    = await loadProfile(session.user.id)
          const needsReset = session.user.user_metadata?.needs_password_reset === true
          set({
            isAuthenticated:      !!profile,
            user:                 profile,
            needsPasswordUpdate:  needsReset,
            isInitializing:       false,
            sessionRecoveryState: 'idle',
          })
        } else {
          set({ isAuthenticated: false, user: null, isInitializing: false })
        }
        _isInitializing = false
        return
      }

      if (event === 'PASSWORD_RECOVERY') {
        // Flujo "olvidé contraseña" — forzar a /reset-password.
        set({ needsPasswordUpdate: true })
      }

      if (event === 'SIGNED_IN' && session?.user) {
        const profile    = await loadProfile(session.user.id)
        const needsReset = session.user.user_metadata?.needs_password_reset === true
        const wasExpired = useAuthStore.getState().sessionRecoveryState === 'expired'

        set({ isAuthenticated: !!profile, user: profile, needsPasswordUpdate: needsReset })

        // Recuperación silenciosa: sesión volvió tras expiración inesperada.
        // Recargar stores en background y mostrar banner "Reconectando…"
        if (wasExpired && profile) {
          set({ sessionRecoveryState: 'reconnecting' })
          const engagementId = useEngagementStore.getState().activeEngagementId
          if (engagementId) {
            try {
              await loadAllCriticalStores(engagementId)
            } catch {
              // Errores individuales ya se loguean dentro de cada store
            }
          }
          set({ sessionRecoveryState: 'idle' })
        }
      }

      if (event === 'SIGNED_OUT') {
        const wasAuthenticated = useAuthStore.getState().isAuthenticated

        // Limpiar TODOS los stores con datos de cliente al cerrar sesión
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

        // Si fue logout intencional → estado normal.
        // Si fue expiración inesperada (tab-switch, timeout) → mostrar overlay.
        const nextRecoveryState: SessionRecoveryState =
          (!_intentionalSignOut && wasAuthenticated) ? 'expired' : 'idle'

        set({ isAuthenticated: false, user: null, sessionRecoveryState: nextRecoveryState })
        _intentionalSignOut = false
      }

      // TOKEN_REFRESHED: Supabase renovó el token automáticamente — no es necesario hacer nada.
    })

    _authSubscription = subscription
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
    // Marcar que es un sign-out intencional para que el handler de SIGNED_OUT
    // no active el overlay de sesión expirada.
    _intentionalSignOut = true
    await supabase.auth.signOut()
    // La limpieza de stores la hace el handler SIGNED_OUT en onAuthStateChange.
    // Solo reseteamos el error y auth state aquí como fallback.
    set({ isAuthenticated: false, user: null, error: null, sessionRecoveryState: 'idle' })
  },

  clearError:          () => set({ error: null }),
  clearPasswordUpdate: () => set({ needsPasswordUpdate: false }),
  clearSessionExpired: () => set({ sessionRecoveryState: 'idle' }),
}))
