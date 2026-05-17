// ============================================================
// Projects Service (antes: engagements.service.ts)
//
// CRUD de proyectos + membresía.
// Sprint 8: renombrado engagement→project, añadido company_id.
//
// Uso típico:
//   const projects = await listMyProjects()
//   const proj     = await createProject({ name: 'Nexus S.A.', companyId })
//   await addProjectMember(proj.id, userId, 'viewer')
// ============================================================

import { supabase }                 from '@/lib/supabase'
import type { ProjectRow, MemberRole } from '@/types/database.types'

// ── Listar proyectos del usuario autenticado ─────────────────

export async function listMyProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`[Projects] listMyProjects: ${error.message}`)
  return data ?? []
}

// ── Crear proyecto ───────────────────────────────────────────

export async function createProject(params: {
  name:          string
  companyId?:    string
  currentPhase?: ProjectRow['current_phase']
  startDate?:    string
}): Promise<ProjectRow> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('[Projects] Usuario no autenticado')

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name:          params.name,
      owner_id:      user.id,
      company_id:    params.companyId ?? null,
      current_phase: params.currentPhase ?? 'listen',
      start_date:    params.startDate ?? null,
    })
    .select()
    .single()

  if (error || !data) throw new Error(`[Projects] createProject: ${error?.message}`)

  // Auto-añadir al creador como consultant
  await supabase.from('project_members').insert({
    project_id: data.id,
    user_id:    user.id,
    role:       'consultant',
  })

  return data
}

// ── Añadir miembro a proyecto ────────────────────────────────

export async function addProjectMember(
  projectId: string,
  userId:    string,
  role:      MemberRole,
): Promise<void> {
  const { error } = await supabase
    .from('project_members')
    .upsert({ project_id: projectId, user_id: userId, role })

  if (error) throw new Error(`[Projects] addProjectMember: ${error.message}`)
}

// ── Listar miembros de un proyecto ──────────────────────────

export async function listProjectMembers(projectId: string) {
  const { data, error } = await supabase
    .from('project_members')
    .select('*, profiles(id, email, name, role)')
    .eq('project_id', projectId)

  if (error) throw new Error(`[Projects] listProjectMembers: ${error.message}`)
  return data ?? []
}

// ── Archivar proyecto ────────────────────────────────────────

export async function archiveProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', projectId)

  if (error) throw new Error(`[Projects] archiveProject: ${error.message}`)
}

// ── Alias de compatibilidad (deprecados) ────────────────────
/** @deprecated Usar listMyProjects */
export const listMyEngagements = listMyProjects
/** @deprecated Usar createProject */
export const createEngagement  = (p: { name: string }) => createProject(p)
/** @deprecated Usar addProjectMember */
export const addMember         = addProjectMember
