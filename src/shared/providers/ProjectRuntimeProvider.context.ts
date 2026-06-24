import { createContext } from 'react'

// ── Tipo del contexto ─────────────────────────────────────────

export interface ProjectRuntime {
  /** ID del proyecto activo — null si no hay ninguno seleccionado */
  projectId: string | null
  /** El usuario puede leer datos de este proyecto */
  canRead:   boolean
  /** El usuario puede editar datos de este proyecto */
  canEdit:   boolean
}

export const DEFAULT_RUNTIME: ProjectRuntime = {
  projectId: null,
  canRead:   false,
  canEdit:   false,
}

export const ProjectRuntimeContext = createContext<ProjectRuntime>(DEFAULT_RUNTIME)
