// ============================================================
// ProjectRuntimeProvider — Context provider de proyecto activo
//
// Responsabilidades:
//   — Exponer projectId, canRead, canEdit a todos los Views.
//   — Loguear cambios de proyecto para diagnóstico.
//   — Loguear eventos de visibilidad para diagnóstico.
//
// Responsabilidades que NO tiene:
//   — NO llamar loadAllCriticalStores.
//   — NO precargar T1/T2/T3/T4/CompanyProfile.
//   — NO refrescar stores al volver de pestaña.
//
// La carga de datos es responsabilidad de cada View vía ensureLoaded:
//   T1View → useT1Store.ensureLoaded(projectId, { reason: 'route_mount' })
//   T2View → useT2Store.ensureLoaded(projectId, { reason: 'route_mount' })
//   T3View → useT3Store.ensureLoaded(projectId, { reason: 'route_mount' })
//   T4View → useT4Store.ensureLoaded(projectId, { reason: 'route_mount' })
//
// Expone useProjectRuntime() como hook para todos los Views.
// ============================================================

import { useEffect }                              from 'react'
import { useEngagementStore }                     from '@/modules/Engagement/store'
import { usePermissions }                         from '@/modules/Auth'
import { ProjectRuntimeContext }                  from './ProjectRuntimeProvider.context'
import type { ProjectRuntime }                    from './ProjectRuntimeProvider.context'

// ── Flags de diagnóstico ──────────────────────────────────────
//
// ENABLE_PROJECT_RUNTIME_GLOBAL_LOAD = false
//   ProjectRuntimeProvider NO llama loadAllCriticalStores.
//   Cada View carga sus propios datos vía ensureLoaded al montar la ruta.
//   Esto elimina la carga global masiva (T1+T2+T3+T4+CompanyProfile en paralelo)
//   que provocaba timeouts en bloque al cambiar de pestaña o montar el provider.
const ENABLE_PROJECT_RUNTIME_GLOBAL_LOAD = false

// ENABLE_TAB_FOCUS_REFRESH = false
//   No se recarga nada al volver de otra pestaña.
const ENABLE_TAB_FOCUS_REFRESH = false

// ── Provider ──────────────────────────────────────────────────

export function ProjectRuntimeProvider({ children }: { children: React.ReactNode }) {
  const projectId = useEngagementStore((s) => s.activeEngagementId)
  const { canEditCompanySettings: canEdit, isReadOnly } = usePermissions()
  const canRead   = !isReadOnly || canEdit

  // Log de cambio de proyecto — diagnóstico sin efectos secundarios.
  useEffect(() => {
    if (!projectId) return
    console.debug('%c[GOBY] activeProjectId →', 'color:#C8860A;font-weight:bold', projectId)
    if (!ENABLE_PROJECT_RUNTIME_GLOBAL_LOAD) {
      console.debug('[PROJECT_RUNTIME] global load skipped because ENABLE_PROJECT_RUNTIME_GLOBAL_LOAD=false')
    }
  }, [projectId])

  // Log de visibilidad — diagnóstico sin efectos secundarios.
  useEffect(() => {
    if (!projectId) return

    function handleVisibilityLog() {
      const state = document.visibilityState
      console.debug('[VISIBILITY]', state)
      if (state === 'visible') {
        if (!ENABLE_TAB_FOCUS_REFRESH) {
          console.debug('[RUNTIME] tab focus refresh skipped because ENABLE_TAB_FOCUS_REFRESH=false')
        }
        if (!ENABLE_PROJECT_RUNTIME_GLOBAL_LOAD) {
          console.debug('[RUNTIME] global load skipped because ENABLE_PROJECT_RUNTIME_GLOBAL_LOAD=false')
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityLog)
    return () => document.removeEventListener('visibilitychange', handleVisibilityLog)
  }, [projectId])

  const value: ProjectRuntime = { projectId, canRead, canEdit }

  return (
    <ProjectRuntimeContext.Provider value={value}>
      {children}
    </ProjectRuntimeContext.Provider>
  )
}
