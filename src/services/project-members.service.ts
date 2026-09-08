// ============================================================
// ProjectMembers Service — Gestión de miembros del proyecto
//
// Data access layer for the project_members table.
// Handles member listing, adding, role updates, removal,
// and user account invitations linked to persons.
// ADR-011: stores call these; components never import
// supabase directly.
// ============================================================

import { supabase } from '@/lib/supabase'
import { makeAuditable } from '@/lib/audit'

export type ProjectMemberRole = 'consultant' | 'client_editor' | 'client_viewer'

export interface ProjectMember {
  project_id: string
  user_id: string
  role: ProjectMemberRole
  added_at: string | null
  profiles?: {
    id: string
    email: string
    name: string | null
    role: string
    person_id?: string | null
  } | null
}

const MEMBER_COLUMNS = `
  project_id,
  user_id,
  role,
  added_at,
  profiles(id, email, name, role, person_id)
`

// ── Implementación privada ───────────────────────────────────

const _impl = {
  async listProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const { data, error } = await supabase
      .from('project_members')
      .select(MEMBER_COLUMNS)
      .eq('project_id', projectId)
      .order('added_at', { ascending: false })

    if (error) throw new Error(`[ProjectMembers] listProjectMembers: ${error.message}`)
    return (data || []) as unknown as ProjectMember[]
  },

  async addProjectMember(
    projectId: string,
    userId: string,
    role: ProjectMemberRole
  ): Promise<void> {
    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
      })

    if (error) throw new Error(`[ProjectMembers] addProjectMember: ${error.message}`)
  },

  async updateProjectMemberRole(
    projectId: string,
    userId: string,
    role: ProjectMemberRole
  ): Promise<void> {
    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) throw new Error(`[ProjectMembers] updateProjectMemberRole: ${error.message}`)
  },

  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) throw new Error(`[ProjectMembers] removeProjectMember: ${error.message}`)
  },

  async inviteAndAddMember(params: {
    projectId: string
    companyId: string
    email: string
    name: string
    role: ProjectMemberRole
    personId?: string | null
  }): Promise<{ userId: string }> {
    // Call the edge function to create auth account and link to company
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: {
        email: params.email,
        name: params.name,
        companyId: params.companyId,
        role: params.role,
        projectId: params.projectId,
        personId: params.personId,
      },
    })

    if (error) throw new Error(`[ProjectMembers] inviteAndAddMember: ${error.message}`)

    // If the edge function didn't create the project_members row directly,
    // add the member here. Most likely the edge function handles it server-side,
    // but this is a fallback.
    if (!data?.userCreated || !data?.projectMemberAdded) {
      const userId = data?.userId
      if (!userId) throw new Error(`[ProjectMembers] inviteAndAddMember: no userId returned from edge function`)

      await this.addProjectMember(params.projectId, userId, params.role)
    }

    return { userId: data?.userId }
  },
}

// ── Exportación pública (ADR-011: solo funciones envueltas en audit)

export const {
  listProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  inviteAndAddMember,
} = makeAuditable(_impl, 'services.projectMembers')
