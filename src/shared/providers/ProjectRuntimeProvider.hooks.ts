import { useContext } from 'react'
import { ProjectRuntimeContext } from './ProjectRuntimeProvider.context'
import type { ProjectRuntime } from './ProjectRuntimeProvider.context'

// ── Hook de consumo ───────────────────────────────────────────

export function useProjectRuntime(): ProjectRuntime {
  return useContext(ProjectRuntimeContext)
}
