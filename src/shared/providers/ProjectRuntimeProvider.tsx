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

// ── Flag de control: refresh automático al volver de otra pestaña ────────────
//
// ENABLE_TAB_FOCUS_REFRESH = false → desactiva completamente cualquier recarga
// automática al volver de otra pestaña (visibilitychange, focus).
//
// Motivo: los logs de producción muestran que el refresh automático dispara
// T1+T2+T3+T4+CompanyProfile en paralelo y provoca timeouts en cadena.
// Con false, cada herramienta gestiona su propio ciclo de carga.
//
// Para reactivar cuando se implemente la arquitectura de refresh selectivo
// (solo el recurso activo, solo si stale, nunca si hay request en vuelo).
const ENABLE_TAB_FOCUS_REFRESH = false

// ── Provider ──────────────────────────────────────────────────

export function ProjectRuntimeProvider({ children }: { children: React.ReactNode }) {
  const projectId          = useEngagementStore((s) => s.activeEngagementId)
  const { canEditCompanySettings: canEdit, isReadOnly } = usePermissions()
  const canRead            = !isReadOnly || canEdit

  // Log activeProjectId en consola cuando se hidrata o cambia — útil para verificar deploys.
  useEffect(() => {
    if (!projectId) return
    console.debug('%c[GOBY] activeProjectId →', 'color:#C8860A;font-weight:bold', projectId)
  }, [projectId])

  // Disparar carga en background al cambiar de proyecto.
  // ensureLoaded en cada store garantiza deduplication y stale guard.
  useEffect(() => {
    if (!projectId) return
    console.debug('[RUNTIME] loadAllCriticalStores called reason=project_change')
    loadAllCriticalStores(projectId, { reason: 'project_change' }).catch(() => {
      // Errores individuales ya se loguean dentro de cada store
    })
  }, [projectId])

  // Refresh al volver de otra pestaña — DESACTIVADO temporalmente.
  // Ver ENABLE_TAB_FOCUS_REFRESH arriba para el motivo.
  useEffect(() => {
    if (!projectId) return
    if (!ENABLE_TAB_FOCUS_REFRESH) return

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return
      console.debug('[RUNTIME] loadAllCriticalStores called reason=visibility_change')
      loadAllCriticalStores(projectId!, { reason: 'visibility_change' }).catch(() => {
        // Errores individuales ya se loguean dentro de cada store
      })
    }

    function handleFocus() {
      console.debug('[FOCUS] window focus')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [projectId])

  // Log de visibilidad siempre activo — para diagnóstico independiente del flag.
  useEffect(() => {
    if (!projectId) return

    function handleVisibilityLog() {
      const state = document.visibilityState
      console.debug('[VISIBILITY]', state)
      if (state === 'visible' && !ENABLE_TAB_FOCUS_REFRESH) {
        console.debug('[RUNTIME] tab focus refresh skipped because ENABLE_TAB_FOCUS_REFRESH=false')
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

// ── Hook de consumo ───────────────────────────────────────────

export function useProjectRuntime(): ProjectRuntime {
  return useContext(ProjectRuntimeContext)
}
