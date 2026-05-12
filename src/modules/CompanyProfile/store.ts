// ============================================================
// CompanyProfile — Zustand store
//
// Estado global del perfil de empresa para el engagement activo.
//
// Modo demo  (engagementId = null): persiste en localStorage.
// Modo real  (engagementId presente): Supabase es la fuente de verdad.
//   - loadProfile(id)   → carga desde Supabase al seleccionar engagement
//   - saveProfile(id)   → upsert a Supabase + actualiza localStorage como cache
//
// Los componentes nunca llaman al servicio directamente:
// siempre pasan por este store.
// ============================================================

import { create }             from 'zustand'
import { persist }            from 'zustand/middleware'
import type { CompanyProfile, Friction, BusinessArea } from './types'
import { EMPTY_PROFILE }      from './types'
import {
  fetchCompanyProfile,
  upsertCompanyProfile,
}                             from '@/services/company-profile.service'

// ── Generador de UUID — compatible con Supabase (columna tipo uuid) ──
function genId(): string {
  return crypto.randomUUID()
}

// ── Store ─────────────────────────────────────────────────────

interface CompanyProfileStore {
  profile:       CompanyProfile
  isDirty:       boolean         // cambios sin guardar
  isLoadingData: boolean         // fetchCompanyProfile en curso (carga inicial)
  isSaving:      boolean         // upsertCompanyProfile en curso (guardado)
  /** @deprecated usa isLoadingData o isSaving según contexto */
  isLoading:     boolean         // alias: isLoadingData || isSaving (para compatibilidad UI)
  saveError:  string | null

  // Ciclo de vida — engagement
  /** Carga el perfil desde Supabase al seleccionar un engagement */
  loadProfile:  (engagementId: string) => Promise<void>

  // Acciones — perfil
  updateField:  <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => void
  toggleArea:   (area: BusinessArea) => void
  /**
   * Persiste el perfil.
   * - Con engagementId: guarda en Supabase (fuente de verdad).
   * - Sin engagementId: solo actualiza localStorage (modo demo).
   */
  saveProfile:  (engagementId?: string) => Promise<void>
  resetProfile: () => void

  // Acciones — fricciones
  addFriction:    () => void
  updateFriction: (id: string, partial: Partial<Friction>) => void
  removeFriction: (id: string) => void
}

export const useCompanyProfileStore = create<CompanyProfileStore>()(
  persist(
    (set, get) => ({
      profile:       { ...EMPTY_PROFILE },
      isDirty:       false,
      isLoadingData: false,
      isSaving:      false,
      isLoading:     false,
      saveError:     null,

      // ── Carga desde Supabase ──────────────────────────────────

      loadProfile: async (engagementId: string) => {
        set({ isLoadingData: true, isLoading: true, saveError: null })

        // Timeout de seguridad: evita spinner infinito si Supabase no responde
        const timeout = setTimeout(() => {
          if (get().isLoadingData) {
            console.warn('[CompanyProfileStore] loadProfile timeout — resetting isLoadingData')
            set({ isLoadingData: false, isLoading: get().isSaving })
          }
        }, 10_000)

        try {
          const result = await fetchCompanyProfile(engagementId)
          clearTimeout(timeout)
          if (result) {
            set({
              profile:       { ...result.profile, fricciones: result.frictions },
              isDirty:       false,
              isLoadingData: false,
              isLoading:     get().isSaving,
            })
          } else {
            // Engagement nuevo — perfil vacío
            set({
              profile:       { ...EMPTY_PROFILE },
              isDirty:       false,
              isLoadingData: false,
              isLoading:     get().isSaving,
            })
          }
        } catch (err) {
          clearTimeout(timeout)
          console.error('[CompanyProfileStore] loadProfile:', err)
          set({ isLoadingData: false, isLoading: get().isSaving })
          // Si falla la carga, se usa el estado local como fallback silencioso
        }
      },

      // ── Mutadores del perfil ──────────────────────────────────

      updateField: (key, value) =>
        set((s) => ({
          profile: { ...s.profile, [key]: value },
          isDirty: true,
        })),

      toggleArea: (area) =>
        set((s) => {
          const has  = s.profile.areasPrioritarias.includes(area)
          const next = has
            ? s.profile.areasPrioritarias.filter((a) => a !== area)
            : [...s.profile.areasPrioritarias, area]
          return { profile: { ...s.profile, areasPrioritarias: next }, isDirty: true }
        }),

      saveProfile: async (engagementId?: string) => {
        const { profile } = get()
        const now = new Date().toISOString()
        const updatedProfile = { ...profile, savedAt: now }

        // Actualizar estado local inmediatamente (UX responsivo)
        set({ profile: updatedProfile, isDirty: false, saveError: null })

        if (!engagementId) {
          // Modo demo: solo localStorage (persist middleware lo maneja)
          return
        }

        // Modo real: persistir en Supabase
        set({ isSaving: true, isLoading: true })
        try {
          await upsertCompanyProfile(updatedProfile, engagementId)
          set({ isSaving: false, isLoading: get().isLoadingData })
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Error desconocido al guardar'
          console.error('[CompanyProfileStore] saveProfile:', err)
          set({ isSaving: false, isLoading: get().isLoadingData, saveError: msg, isDirty: true })
        }
      },

      resetProfile: () =>
        set({ profile: { ...EMPTY_PROFILE }, isDirty: false, saveError: null, isLoadingData: false, isSaving: false, isLoading: false }),

      // ── Mutadores de fricciones ───────────────────────────────

      addFriction: () =>
        set((s) => ({
          profile: {
            ...s.profile,
            fricciones: [
              ...s.profile.fricciones,
              {
                id:            genId(),
                tipo:          '',
                areaFuncional: '',
                frecuencia:    null,
                impacto:       null,
                notas:         '',
              } satisfies Friction,
            ],
          },
          isDirty: true,
        })),

      updateFriction: (id, partial) =>
        set((s) => ({
          profile: {
            ...s.profile,
            fricciones: s.profile.fricciones.map((f) =>
              f.id === id ? { ...f, ...partial } : f
            ),
          },
          isDirty: true,
        })),

      removeFriction: (id) =>
        set((s) => ({
          profile: {
            ...s.profile,
            fricciones: s.profile.fricciones.filter((f) => f.id !== id),
          },
          isDirty: true,
        })),
    }),
    {
      name:       'lean-company-profile',
      version:    3,  // bumped: separados isLoadingData/isSaving, timeout en loadProfile
      // Solo persistir datos de negocio. Todo estado transitorio (loading/error) se reinicia en cada sesión.
      partialize: (s) => ({ profile: s.profile, isDirty: s.isDirty }),
    }
  )
)
