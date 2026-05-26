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
import { resetAllEngagementStores, loadAllCriticalStores } from '@/lib/resetEngagementStores'
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
  // companyId: si se pasa (superadmin/consultant) se usa directamente;
  //            si no (client_editor), se infiere del perfil del usuario.
  createAndSelect: (name: string, companyId?: string) => Promise<ProjectRow>
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
        // Hard Reset: limpiar todos los stores T1-T12 antes de cambiar el engagement
        // Garantiza cero stale data entre proyectos — Sprint 9 Bloque 2
        resetAllEngagementStores()
        set({ activeEngagementId: id })

        // Eager Loading: disparar carga paralela de stores críticos (T1–T4)
        // Fire-and-forget — los stale guards de cada store descartan resultados
        // en vuelo si el usuario vuelve a cambiar de proyecto antes de que terminen.
        // Sprint 9 Bloque 3: navegación instantánea sin spinners por pantalla.
        if (id) {
          loadAllCriticalStores(id).catch(() => {
            // Errores individuales ya se loguean dentro de cada store (console.error)
          })
        }
      },

      createAndSelect: async (name, companyId) => {
        set({ isLoading: true })
        try {
          // Si companyId viene explícito (superadmin/consultant lo pasan desde el selector)
          // lo usamos directamente. Si no (client_editor), lo inferimos del perfil.
          let resolvedCompanyId = companyId
          if (!resolvedCompanyId) {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single()
              resolvedCompanyId = profile?.company_id ?? undefined
            }
          }

          const project = await createProject({ name, companyId: resolvedCompanyId })
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
