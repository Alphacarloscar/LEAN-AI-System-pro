// ============================================================
// ProjectMembershipGuard — Route guard for project-scoped access
//
// Wraps the /evaluation/projects/:projectId subtree.
// Handles membership verification, project status checks
// (paused/archived/completed → read-only), and role-based access.
//
// Exposes ProjectMembershipContext with { myRole, isProjectReadOnly }
// for child routes to determine edit capability and display status banners.
// ============================================================

import { createContext, useContext, useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router'
import { Spinner } from '@/shared/design-system/components'
import { AccessDeniedView } from '@/shared/components/AccessDeniedView'
import { ProjectReadOnlyBanner } from './ProjectReadOnlyBanner'
import { useProjectStore } from '@/modules/Engagement/store'
import { useAuthStore } from '@/modules/Auth'
import * as projectsService from '@/services/projects.service'
import * as projectMembersService from '@/services/project-members.service'
import type { ProjectMemberRole } from '@/services/project-members.service'

// ── Context API ──────────────────────────────────────────────

export interface ProjectMembershipContextType {
  projectId: string
  myRole: ProjectMemberRole | null
  isProjectReadOnly: boolean
  projectStatus?: 'active' | 'paused' | 'archived' | 'completed'
}

export const ProjectMembershipContext = createContext<ProjectMembershipContextType | null>(null)

export function useProjectMembership() {
  const ctx = useContext(ProjectMembershipContext)
  if (!ctx) {
    throw new Error('useProjectMembership must be called within ProjectMembershipGuard')
  }
  return ctx
}

// ── Component ────────────────────────────────────────────────

export function ProjectMembershipGuard() {
  const { projectId } = useParams<{ projectId: string }>()

  const { selectProject } = useProjectStore()
  const { user } = useAuthStore()

  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    project?: any
    myRole: ProjectMemberRole | null
    isProjectReadOnly: boolean
  }>({
    loading: true,
    error: null,
    myRole: null,
    isProjectReadOnly: false,
  })

  useEffect(() => {
    if (!projectId) {
      setState((prev) => ({ ...prev, error: 'No project ID provided' }))
      return
    }

    // Sync the URL projectId with the project store
    // (ensures ProjectRuntimeProvider picks it up correctly)
    selectProject(projectId)

    // Verify membership by attempting to fetch the project
    // RLS will naturally deny non-members (0 rows returned)
    const load = async () => {
      try {
        const project = await projectsService.getProjectById(projectId)

        if (!project) {
          // RLS denied access — user is not a member
          setState((prev) => ({
            ...prev,
            loading: false,
            error: 'not-found', // Will trigger 403 screen
          }))
          return
        }

        // Member exists; now check role and project status
        // For this guard, we accept any member role (consultant/client_editor/client_viewer).
        // Per-operation permissions are handled in the members screen UI.
        // We determine read-only based on project status.

        const members = await projectMembersService.listProjectMembers(projectId)
        const myMember = members.find((m) => m.profiles?.id === user?.id)
        const myRole = (myMember?.role ?? null) as ProjectMemberRole | null

        const isReadOnly = project.status !== 'active' // Paused/archived/completed → read-only for all

        setState((prev) => ({
          ...prev,
          loading: false,
          project,
          myRole,
          isProjectReadOnly: isReadOnly,
        }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }))
      }
    }

    load()
  }, [projectId, selectProject, user])

  if (state.loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (state.error === 'not-found') {
    return <AccessDeniedView returnPath="/evaluation" />
  }

  if (state.error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-2xl font-semibold text-warm-950">Error</h1>
          <p className="text-warm-700">{state.error}</p>
        </div>
      </div>
    )
  }

  const contextValue: ProjectMembershipContextType = {
    projectId: projectId || '',
    myRole: state.myRole,
    isProjectReadOnly: state.isProjectReadOnly,
    projectStatus: state.project?.status,
  }

  return (
    <ProjectMembershipContext.Provider value={contextValue}>
      <div className="flex flex-col">
        {state.isProjectReadOnly && state.project?.status !== 'active' && (
          <ProjectReadOnlyBanner status={state.project.status} />
        )}
        <Outlet />
      </div>
    </ProjectMembershipContext.Provider>
  )
}
