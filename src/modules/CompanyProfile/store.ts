// ============================================================
// CompanyProfile — Zustand store
//
// Estado global del perfil de empresa para el engagement activo.
// Persistido en localStorage en modo demo/dev.
// Sprint 5+: se reemplaza por lectura/escritura en Supabase
// via company_profiles + friction_register tables.
// ============================================================

import { create }                from 'zustand'
import { persist }               from 'zustand/middleware'
import type { CompanyProfile, Friction, BusinessArea } from './types'
import { EMPTY_PROFILE }         from './types'

// ── Generador de ID simple (sin uuid dependency) ──────────────
function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ── Store ─────────────────────────────────────────────────────

interface CompanyProfileStore {
  profile:     CompanyProfile
  isDirty:     boolean  // cambios sin guardar

  // Acciones — perfil
  updateField:  <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => void
  toggleArea:   (area: BusinessArea) => void
  saveProfile:  () => void
  resetProfile: () => void

  // Acciones — fricciones
  addFriction:    () => void
  updateFriction: (id: string, partial: Partial<Friction>) => void
  removeFriction: (id: string) => void
}

export const useCompanyProfileStore = create<CompanyProfileStore>()(
  persist(
    (set) => ({
      profile:  { ...EMPTY_PROFILE },
      isDirty:  false,

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

      saveProfile: () =>
        set((s) => ({
          profile: { ...s.profile, savedAt: new Date().toISOString() },
          isDirty: false,
        })),

      resetProfile: () =>
        set({ profile: { ...EMPTY_PROFILE }, isDirty: false }),

      addFriction: () =>
        set((s) => ({
          profile: {
            ...s.profile,
            fricciones: [
              ...s.profile.fricciones,
              {
                id:           genId(),
                tipo:         '',
                areaFuncional:'',
                frecuencia:   null,
                impacto:      null,
                notas:        '',
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
      name:    'lean-company-profile',
      version: 1,
    }
  )
)
