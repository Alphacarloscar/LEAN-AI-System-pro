// ============================================================
// ProjectMembersRouteView — Route wrapper for members screen
//
// Thin wrapper that reads :projectId param and renders
// ProjectMembersView, mirroring T1RouteView / T9RouteView pattern.
// ============================================================

import { useParams } from 'react-router'
import { ProjectMembersView } from './ProjectMembersView'

export function ProjectMembersRouteView() {
  const { projectId } = useParams<{ projectId: string }>()

  if (!projectId) {
    return <div>Error: Project ID not found</div>
  }

  return <ProjectMembersView projectId={projectId} />
}
