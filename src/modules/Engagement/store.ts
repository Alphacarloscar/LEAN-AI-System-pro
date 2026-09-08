// ============================================================
// Project Store
//
// Gestiona el proyecto activo en la sesión.
// Un consultor puede tener múltiples proyectos (multi-client).
// Este store trackea cuál está seleccionado ahora mismo.
//
// Flujo:
//   1. Tras login → loadMyProjects()
//   2. Si hay uno solo → auto-select
//   3. Si hay varios → mostrar selector (Sprint 4 UI)
//   4. selectProject(id) → el resto de stores cargan sus datos
// ============================================================

import { create }                         from 'zustand'
import { persist }                        from 'zustand/middleware'
import { listMyProjects, createProject, updateProject } from '@/services/projects.service'
import { getAuthUserCompanyId }          from '@/services/auth.service'
import { resetAllEngagementStores } from '@/lib/resetEngagementStores'
import { reportError }               from '@/lib/reportError'
import type { ProjectRow }                from '@/types/database.types'

interface ProjectStore {
  projects: ProjectRow[]
  activeProjectId: string | null
  isLoading:          boolean
  // Backward compat (Phase 2 will migrate to activeProjectId)
  activeEngagementId: string | null

  // Carga los proyectos del usuario logueado
  loadMyProjects: () => Promise<void>
  // Selecciona el proyecto activo (y notifica a los stores T1-T6)
  selectProject:   (id: string | null) => void
  // Crea un nuevo proyecto y lo selecciona
  // companyId: si se pasa (superadmin/consultant) se usa directamente;
  //            si no (client_editor), se infiere del perfil del usuario.
  createAndSelect: (
    name: string,
    companyId?: string,
    extra?: {
      objetivoPrincipalIA?:    string
      horizonteEsperadoValor?: string
      ecosistemaTecnologico?:  string
      areasPrioritarias?:      string[]
    }
  ) => Promise<ProjectRow>
  // Limpia el estado al logout
  reset:              () => void
  // Backward compat (Phase 2 will migrate to selectProject)
  selectEngagement: (id: string | null) => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects:        [],
      activeProjectId: null,
      activeEngagementId: null,
      isLoading:          false,

      loadMyProjects: async () => {
        set({ isLoading: true })
        // Timeout de seguridad: isLoading no puede quedarse atascado
        const timeout = setTimeout(() => {
          const { isLoading } = get()
          if (isLoading) {
            reportError('[ProjectStore] loadMyProjects timeout', new Error('isLoading safety timeout exceeded'))
            set({ isLoading: false })
          }
        }, 10_000)
        try {
          const projects = await listMyProjects()
          clearTimeout(timeout)
          set({ projects, isLoading: false })

          // Auto-select si hay exactamente uno
          const { activeProjectId } = get()
          if (!activeProjectId && projects.length === 1) {
            const id = projects[0].id
            set({ activeProjectId: id, activeEngagementId: id })
          }
          // Si el activeProjectId guardado ya no existe → limpiar
          if (
            activeProjectId &&
            !projects.find((p) => p.id === activeProjectId)
          ) {
            const id = projects[0]?.id ?? null
            set({ activeProjectId: id, activeEngagementId: id })
          }
        } catch (err) {
          clearTimeout(timeout)
          reportError('[ProjectStore] loadMyProjects', err)
          set({ isLoading: false })
        }
      },

      selectProject: (id) => {
        const { activeProjectId, activeEngagementId } = get()
        // Backward compat: check both activeProjectId and activeEngagementId for noop
        const currentId = activeProjectId ?? activeEngagementId

        // NO-OP: si el proyecto seleccionado es el mismo que ya está activo,
        // no resetear ni disparar carga. Evita recargas innecesarias al
        // re-abrir el selector o al hacer click en el proyecto ya activo.
        if (id === currentId) {
          return
        }

        // Hard Reset: limpiar stores T1-T12 ANTES de cambiar activeProjectId.
        // Garantiza cero stale data entre proyectos.
        // La CARGA de los nuevos datos la gestiona exclusivamente ProjectRuntimeProvider,
        // que observa el cambio de activeProjectId vía useEffect([projectId]).
        resetAllEngagementStores()
        set({ activeProjectId: id, activeEngagementId: id })
      },

      selectEngagement: (id) => {
        // Backward compat wrapper — Phase 2 will remove this
        // Delegates to selectProject, but selectProject checks activeProjectId
        // For full backward compat, pass through the new method
        get().selectProject(id)
      },

      createAndSelect: async (name, companyId, extra) => {
        set({ isLoading: true })
        try {
          let resolvedCompanyId = companyId
          if (!resolvedCompanyId) {
            resolvedCompanyId = await getAuthUserCompanyId()
          }
          const project = await createProject({
            name,
            companyId:             resolvedCompanyId,
            objetivoPrincipal:     extra?.objetivoPrincipalIA,
            horizonteValor:        extra?.horizonteEsperadoValor,
            ecosistemaTecnologico: extra?.ecosistemaTecnologico,
          })
          // Guardar áreas prioritarias via updateProject (RPC separado)
          if (extra?.areasPrioritarias?.length) {
            await updateProject(project.id, { areasPrioritarias: extra.areasPrioritarias })
          }
          set((s) => ({
            projects:           [...s.projects, project],
            activeProjectId: project.id,
            activeEngagementId: project.id,
            isLoading:          false,
          }))
          return project
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      reset: () => set({ projects: [], activeProjectId: null, activeEngagementId: null, isLoading: false }),
    }),
    {
      name:       'lean-active-project',
      version:    1,
      // Solo persistir el ID activo, no la lista completa (puede quedar stale)
      partialize: (s) => ({ activeProjectId: s.activeProjectId }),
    }
  )
)

// Backward compat alias during refactor Phase 1 → Phase 2
// Phase 2 will rename all imports from useEngagementStore → useProjectStore
export const useEngagementStore = useProjectStore
