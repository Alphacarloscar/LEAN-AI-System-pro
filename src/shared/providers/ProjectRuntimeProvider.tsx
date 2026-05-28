// ============================================================
// ProjectRuntimeProvider — Orquestador del contexto de proyecto
//
// Sprint 10: centraliza el contexto base de proyecto y dispara
// las cargas críticas en background (fire-and-forget) cuando
// cambia el projectId activo.
//
// Filosofía: NO bloqueante.
//   — Bloqueo legítimo: solo si falta autenticación o projectId.
//   — Carga en background: T1–T4 + CompanyProfile.
//   — Las tools montan su shell inmediatamente y gestionan sus
//     propios estados de carga vía banners no bloqueantes.
//
// Expone useProjectRuntime() como hook para todos los Views.
// Reemplaza el patrón disperso:
//   useEngagementStore(s => s.activeEngagementId) + usePermissions()
// en cada herramienta.
// ============================================================

import { createContext, useContext, useEffect } from 'react'
import { useEngagementStore }                  from '@/modules/Engagement/store'
import { usePermissions }                      from '@/modules/Auth'
import { loadAllCriticalStores }               from '@/lib/resetEngagementStores'

// ── Tipo del contexto ─────────────────────────────────────────

export interface ProjectRuntime {
  /** ID del proyecto activo — null si no hay ninguno seleccionado */
  projectId: string | null
  /** El usuario puede leer datos de este proyecto */
  canRead:   boolean
  /** El usuario puede editar datos de este proyecto */
  canEdit:   boolean
}

const DEFAULT_RUNTIME: ProjectRuntime = {
  projectId: null,
  canRead:   false,
  canEdit:   false,
}

const ProjectRuntimeContext = createContext<ProjectRuntime>(DEFAULT_RUNTIME)

// ── Provider ──────────────────────────────────────────────────

export function ProjectRuntimeProvider({ children }: { children: React.ReactNode }) {
  const projectId          = useEngagementStore((s) => s.activeEngagementId)
  const { canEditCompanySettings: canEdit, isReadOnly } = usePermissions()
  const canRead            = !isReadOnly || canEdit

  // Disparar carga en background al cambiar de proyecto.
  // Fire-and-forget: las tools montan su shell inmediatamente.
  // Los stale guards de cada store protegen contra cargas en vuelo.
  useEffect(() => {
    if (!projectId) return
    loadAllCriticalStores(projectId).catch(() => {
      // Errores individuales ya se loguean dentro de cada store
    })
  }, [projectId])

  const value: ProjectRuntime = { projectId, canRead, canEdit }

  return (
    <ProjectRuntimeContext.Provider value={value}>
      {children}
    </ProjectRuntimeContext.Provider>
  )
}

// ── Hook de consumo ───────────────────────────────────────────

export function useProjectRuntime(): ProjectRuntime {
  return useContext(ProjectRuntimeContext)
}
