// ============================================================
// Engagement Store
//
// Gestiona el engagement activo en la sesión.
// Un consultor puede tener múltiples engagements (multi-client).
// Este store trackea cuál está seleccionado ahora mismo.
//
// Flujo:
//   1. Tras login → loadMyProjects()
//   2. Si hay uno solo → auto-select
//   3. Si hay varios → mostrar selector (Sprint 4 UI)
//   4. selectEngagement(id) → el resto de stores cargan sus datos
// ============================================================

import { create }                         from 'zustand'
import { persist }                        from 'zustand/middleware'
import { listMyProjects, createProject }  from '@/services/projects.service'
import { supabase }                       from '@/lib/supabase'
import type { ProjectRow }                from '@/types/database.types'

interface EngagementStore {
  projects: ProjectRow[]
  activeEngagementId: string | null
  isLoading:          boolean

  // Carga los engagements del usuario logueado
  loadMyProjects: () => Promise<void>
  // Selecciona el engagement activo (y notifica a los stores T1-T6)
  selectEngagement:   (id: string | null) => void
  // Crea un nuevo engagement y lo selecciona
  createAndSelect: (name: string) => Promise<ProjectRow>
  // Limpia el estado al logout
  reset:              () => void
}

export const useEngagementStore = create<EngagementStore>()(
  persist(
    (set, get) => ({
      projects:        [],
      activeEngagementId: null,
      isLoading:          false,

      loadMyProjects: async () => {
        set({ isLoading: true })
        // Timeout de seguridad: isLoading no puede quedarse atascado
        const timeout = setTimeout(() => {
          const { isLoading } = get()
          if (isLoading) {
            console.warn('[EngagementStore] loadMyEngagements timeout — resetting isLoading')
            set({ isLoading: false })
          }
        }, 10_000)
        try {
          const projects = await listMyProjects()
          clearTimeout(timeout)
          set({ projects, isLoading: false })

          // Auto-select si hay exactamente uno
          const { activeEngagementId } = get()
          if (!activeEngagementId && projects.length === 1) {
            set({ activeEngagementId: projects[0].id })
          }
          // Si el activeEngagementId guardado ya no existe → limpiar
          if (
            activeEngagementId &&
            !projects.find((p) => p.id === activeEngagementId)
          ) {
            set({ activeEngagementId: projects[0]?.id ?? null })
          }
        } catch (err) {
          clearTimeout(timeout)
          console.error('[EngagementStore] loadMyProjects:', err)
          set({ isLoading: false })
        }
      },

      selectEngagement: (id) => {
        set({ activeEngagementId: id })
      },

      createAndSelect: async (name) => {
        set({ isLoading: true })
        try {
          // Obtener company_id del perfil del usuario autenticado
          // para que el proyecto quede ligado a su empresa
          const { data: { user } } = await supabase.auth.getUser()
          let companyId: string | undefined
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('company_id')
              .eq('id', user.id)
              .single()
            companyId = profile?.company_id ?? undefined
          }

          const project = await createProject({ name, companyId })
          set((s) => ({
            projects:           [...s.projects, project],
            activeEngagementId: project.id,
            isLoading:          false,
          }))
          return project
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      reset: () => set({ projects: [], activeEngagementId: null, isLoading: false }),
    }),
    {
      name:       'lean-active-engagement',
      version:    1,
      // Solo persistir el ID activo, no la lista completa (puede quedar stale)
      partialize: (s) => ({ activeEngagementId: s.activeEngagementId }),
    }
  )
)
