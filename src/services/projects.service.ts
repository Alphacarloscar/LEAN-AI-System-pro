// ============================================================
// Projects Service (antes: engagements.service.ts)
//
// CRUD de proyectos + membresía.
// Sprint 8: renombrado engagement→project, añadido company_id.
// Sprint 10: wrapped con makeAuditable — trazabilidad automática.
//
// Uso típico:
//   const projects = await listMyProjects()
//   const proj     = await createProject({ name: 'Nexus S.A.', companyId })
//   await addProjectMember(proj.id, userId, 'viewer')
// ============================================================

import { supabase }                    from '@/lib/supabase'
import { makeAuditable }               from '@/lib/audit'
import type { ProjectRow, ProjectRowWithDomain, MemberRole } from '@/types/database.types'

export interface ProjectCompanyData {
  company_id:   string | null
  company_name: string
  sector:       string
  company_size: string
}

export interface ProjectFriction {
  id: string
  tipo: string
  areaFuncional: string
  frecuencia: 'Baja' | 'Media' | 'Alta' | null
  impacto: 'Bajo' | 'Medio' | 'Alto' | null
  notas: string
}

// ── Implementaciones privadas ────────────────────────────────
// Los cuerpos son idénticos a la versión anterior.
// makeAuditable envuelve este objeto y devuelve el mismo tipo,
// por lo que los exports públicos conservan firmas y autocompletado.

const _impl = {

  async listMyProjects(): Promise<ProjectRow[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, governance_domains!projects_domain_id_fkey(id, slug, label)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`[Projects] listMyProjects: ${error.message}`)
    return (data ?? []) as ProjectRow[]
  },

  // Sprint 8: usa RPC con SECURITY DEFINER en lugar de INSERT directo.
  // Esto resuelve el desajuste auth.uid() en RLS vs owner_id del cliente.
  // La función SQL maneja también el INSERT en project_members.
  async createProject(params: {
    name:          string
    companyId?:    string
    domainId?:     string
    currentPhase?: ProjectRow['current_phase']
    startDate?:    string
    objetivoPrincipal?: string
    restricciones?: string
    horizonteValor?: string
    ecosistemaTecnologico?: string
    friccionesOportunidades?: string | ProjectFriction[]
  }): Promise<ProjectRow> {
    // Convertir array de fricciones a JSON string si es necesario
    let friccionesString: string | undefined
    if (params.friccionesOportunidades) {
      if (typeof params.friccionesOportunidades === 'string') {
        friccionesString = params.friccionesOportunidades
      } else {
        friccionesString = JSON.stringify(params.friccionesOportunidades)
      }
    }

    const { data, error } = await supabase.rpc('create_project', {
      p_name:       params.name,
      p_company_id: params.companyId ?? undefined,
      p_domain_id:  params.domainId ?? undefined,
      p_phase:      params.currentPhase ?? 'listen',
      p_objetivo_principal: params.objetivoPrincipal ?? undefined,
      p_restricciones: params.restricciones ?? undefined,
      p_horizonte_valor: params.horizonteValor ?? undefined,
      p_ecosistema_tecnologico: params.ecosistemaTecnologico ?? undefined,
      p_fricciones_oportunidades: friccionesString ?? undefined,
    })

    if (error) {
      throw new Error(`[Projects] createProject RPC error: ${error.message}`)
    }

    // RPC can return a single object or an array of one. Handle both.
    const project = Array.isArray(data) ? data[0] : data

    if (!project) {
      throw new Error('[Projects] createProject: No data returned from RPC.')
    }

    return project as ProjectRow
  },

  async addProjectMember(
    projectId: string,
    userId:    string,
    role:      MemberRole,
  ): Promise<void> {
    const { error } = await supabase
      .from('project_members')
      .upsert({ project_id: projectId, user_id: userId, role })

    if (error) throw new Error(`[Projects] addProjectMember: ${error.message}`)
  },

  async listProjectMembers(projectId: string) {
    const { data, error } = await supabase
      .from('project_members')
      .select('*, profiles(id, email, name, role)')
      .eq('project_id', projectId)

    if (error) throw new Error(`[Projects] listProjectMembers: ${error.message}`)
    return data ?? []
  },

  async archiveProject(projectId: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', projectId)

    if (error) throw new Error(`[Projects] archiveProject: ${error.message}`)
  },

  // Usado por vistas de herramientas T1/T2/T3 para cargar departamentos
  // sin acceder a supabase directamente desde los componentes (ADR-011).
  async getProjectCompanyId(projectId: string): Promise<string | null> {
    const { data } = await supabase
      .from('projects')
      .select('company_id')
      .eq('id', projectId)
      .maybeSingle()

    return (data?.company_id as string | null) ?? null
  },

  // Lista id+name de todos los proyectos de una empresa (sin filtrar por
  // status — se quieren ver también personas de proyectos archivados).
  // Usado por CompanyPeopleSection para el filtro de proyecto y el
  // selector de proyecto al dar de alta una persona.
  async listProjectsByCompany(companyId: string): Promise<Pick<ProjectRow, 'id' | 'name' | 'domain_id'>[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, domain_id')
      .eq('company_id', companyId)
      .order('name', { ascending: true })

    if (error) throw new Error(`[Projects] listProjectsByCompany: ${error.message}`)
    return data ?? []
  },

  // Devuelve company_id y datos de la empresa asociada.
  // Usado por CompanyProfileView (ADR-011).
  async getProjectWithCompany(projectId: string): Promise<ProjectCompanyData> {
    const { data, error } = await supabase
      .from('projects')
      .select('company_id, companies(name, sector, company_size)')
      .eq('id', projectId)
      .single()

    if (error) throw new Error(`[Projects] getProjectWithCompany: ${error.message}`)

    const company = data?.companies as { name?: string; sector?: string; company_size?: string } | null
    return {
      company_id:   (data?.company_id as string | null) ?? null,
      company_name: company?.name        ?? '',
      sector:       company?.sector      ?? '',
      company_size: company?.company_size ?? '',
    }
  },

  // Obtener proyecto completo con todos sus campos
  async getProjectById(projectId: string): Promise<ProjectRowWithDomain> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, governance_domains!projects_domain_id_fkey(id, slug, label)')
      .eq('id', projectId)
      .single()

    if (error) throw new Error(`[Projects] getProjectById: ${error.message}`)
    return data as ProjectRowWithDomain
  },

  // Actualizar proyecto existente
  async updateProject(projectId: string, params: {
    name?: string
    objetivoPrincipal?: string
    restricciones?: string
    horizonteValor?: string
    ecosistemaTecnologico?: string
    friccionesOportunidades?: ProjectFriction[]
    areasPrioritarias?: string[]
    contractedPackages?: string[]
  }): Promise<ProjectRow> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('update_project', {
      p_project_id: projectId,
      p_name: params.name ?? undefined,
      p_objetivo_principal: params.objetivoPrincipal ?? undefined,
      p_restricciones: params.restricciones ?? undefined,
      p_horizonte_valor: params.horizonteValor ?? undefined,
      p_ecosistema_tecnologico: params.ecosistemaTecnologico ?? undefined,
      p_fricciones_oportunidades: params.friccionesOportunidades ? JSON.stringify(params.friccionesOportunidades) : undefined,
      p_areas_prioritarias: params.areasPrioritarias ?? undefined,
    })

    if (error) throw new Error(`[Projects] updateProject RPC error: ${error.message}`)

    // contracted_packages no está en el RPC — se actualiza directamente
    if (params.contractedPackages !== undefined) {
      const { error: pkgError } = await supabase
        .from('projects')
        .update({ contracted_packages: params.contractedPackages })
        .eq('id', projectId)
      if (pkgError) throw new Error(`[Projects] updateProject packages error: ${pkgError.message}`)
    }

    return data as ProjectRow
  },

  // Eliminar proyecto (limpia project_members y company_profiles)
  async deleteProject(projectId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.rpc as any)('delete_project', {
      p_project_id: projectId,
    })

    if (error) throw new Error(`[Projects] deleteProject RPC error: ${error.message}`)
  },

  // ── Epic 4: Funciones de admin para gestión de proyectos ──────

  // Epic 4: cambiar estado de proyecto con validaciones de rol
  // Estados: active, paused, archived, completed
  async updateProjectStatus(projectId: string, newStatus: 'active' | 'paused' | 'archived' | 'completed'): Promise<ProjectRow> {
    const validStatuses = ['active', 'paused', 'archived', 'completed']
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`[Projects] updateProjectStatus: Invalid status '${newStatus}'`)
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .select()
      .single()

    if (error || !data) throw new Error(`[Projects] updateProjectStatus: ${error?.message}`)
    return data as ProjectRow
  },

  // Epic 4: obtener estadísticas de proyecto (nº miembros, etc)
  async getProjectStats(projectId: string): Promise<{ memberCount: number }> {
    const { count, error } = await supabase
      .from('project_members')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)

    if (error) throw new Error(`[Projects] getProjectStats: ${error.message}`)
    return { memberCount: count ?? 0 }
  },

  // Epic 4: eliminar miembro de proyecto
  async removeProjectMember(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) throw new Error(`[Projects] removeProjectMember: ${error.message}`)
  },

  // Epic 4: actualizar rol de miembro en proyecto
  async updateProjectMemberRole(projectId: string, userId: string, role: MemberRole): Promise<void> {
    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (error) throw new Error(`[Projects] updateProjectMemberRole: ${error.message}`)
  },

  // Epic 4: actualizar info de proyecto (nombre, etc)
  async updateProjectInfo(projectId: string, params: {
    name?: string
    contractedPackages?: string[]
  }): Promise<ProjectRow> {
    type UpdatePayload = {
      name?: string
      contracted_packages?: string[]
    }

    const updates: UpdatePayload = {}
    if (params.name !== undefined) updates.name = params.name
    if (params.contractedPackages !== undefined) updates.contracted_packages = params.contractedPackages

    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error || !data) throw new Error(`[Projects] updateProjectInfo: ${error?.message}`)
    return data as ProjectRow
  },

  // Epic 4: listar todos los proyectos de una empresa (incluyendo archivados) para admin
  async listAllProjectsByCompany(companyId: string): Promise<ProjectRow[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`[Projects] listAllProjectsByCompany: ${error.message}`)
    return (data ?? []) as ProjectRow[]
  },

  // Epic 4: obtener miembros de proyecto con detalles de perfil
  async getProjectMembers(projectId: string): Promise<Array<{
    user_id: string
    role: string
    added_at: string | null
    profile: { id: string; email: string; name: string; role: string } | null
  }>> {
    const { data, error } = await supabase
      .from('project_members')
      .select('user_id, role, added_at, profiles(id, email, name, role)')
      .eq('project_id', projectId)
      .order('added_at', { ascending: false })

    if (error) throw new Error(`[Projects] getProjectMembers: ${error.message}`)

    // Remap 'profiles' to 'profile' for consistency
    return ((data ?? []) as any[]).map((member) => ({
      user_id: member.user_id,
      role: member.role,
      added_at: member.added_at,
      profile: member.profiles,
    }))
  },

  async listUserProjects(userId: string): Promise<ProjectRow[]> {
    const { data, error } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId)

    if (error) throw new Error(`[Projects] listUserProjects: ${error.message}`)

    if (!data || data.length === 0) return []

    const projectIds = data.map((m) => m.project_id)
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('*, governance_domains!projects_domain_id_fkey(id, slug, label)')
      .in('id', projectIds)
      .order('created_at', { ascending: false })

    if (projError) throw new Error(`[Projects] listUserProjects (fetch projects): ${projError.message}`)
    return (projects ?? []) as ProjectRow[]
  },
}

// ── Punto de exportación auditado ────────────────────────────
// makeAuditable devuelve exactamente typeof _impl — autocompletado intacto.
// Cada llamada a cualquier método queda registrada en audit_logs
// con args, respuesta, duración y contexto del usuario autenticado.

const _service = makeAuditable(_impl, 'services.projects')

export const {
  listMyProjects,
  createProject,
  addProjectMember,
  listProjectMembers,
  archiveProject,
  getProjectCompanyId,
  getProjectWithCompany,
  listProjectsByCompany,
  getProjectById,
  updateProject,
  deleteProject,
  updateProjectStatus,
  getProjectStats,
  removeProjectMember,
  updateProjectMemberRole,
  updateProjectInfo,
  listAllProjectsByCompany,
  getProjectMembers,
  listUserProjects,
} = _service

// ── Alias de compatibilidad (deprecados) ────────────────────
/** @deprecated Usar listMyProjects */
export const listMyEngagements = listMyProjects
/** @deprecated Usar createProject */
export const createEngagement  = (p: { name: string }) => createProject(p)
/** @deprecated Usar addProjectMember */
export const addMember         = addProjectMember
