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

import { createContext, useContext, useEffect, useRef } from 'react'
import { useEngagementStore }                           from '@/modules/Engagement/store'
import { usePermissions }                               from '@/modules/Auth'
import { loadAllCriticalStores }                        from '@/lib/resetEngagementStores'

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

  // Refs de deduplicación — previenen cargas dobles por remounts o StrictMode.
  // inFlightRef:       el projectId para el que hay una carga en vuelo ahora mismo.
  // lastLoadedRef:     el projectId para el que se completó la última carga.
  const inFlightRef    = useRef<string | null>(null)
  const lastLoadedRef  = useRef<string | null>(null)

  // Log activeProjectId en consola cuando se hidrata o cambia.
  useEffect(() => {
    if (!projectId) return
    console.debug('%c[GOBY] activeProjectId →', 'color:#C8860A;font-weight:bold', projectId)
  }, [projectId])

  // Único orquestador de carga global — ProjectRuntimeProvider.
  // EngagementStore.selectEngagement ya NO llama loadAllCriticalStores.
  // Reglas:
  //   1. Si !projectId → no cargar.
  //   2. Si inFlight para el mismo proyecto → skip (carga en curso).
  //   3. Si ya cargado para el mismo proyecto → ensureLoaded aplicará stale guard.
  //   4. Si cambió el proyecto → cargar (inFlight previo era de otro proyecto).
  useEffect(() => {
    if (!projectId) return

    if (inFlightRef.current === projectId) {
      console.debug('[PROJECT_RUNTIME] skipped — reason=in_flight', { projectId: projectId.slice(0, 8) })
      return
    }

    const previousProjectId = lastLoadedRef.current
    const willLoad = true
    console.debug('[PROJECT_RUNTIME] project change detected', {
      previousProjectId: previousProjectId?.slice(0, 8) ?? null,
      nextProjectId:     projectId.slice(0, 8),
      willLoad,
    })

    inFlightRef.current = projectId
    loadAllCriticalStores(projectId, { reason: 'project_change' })
      .then(() => {
        lastLoadedRef.current = projectId
      })
      .catch(() => {
        // Errores individuales ya se loguean dentro de cada store
      })
      .finally(() => {
        if (inFlightRef.current === projectId) {
          inFlightRef.current = null
        }
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
