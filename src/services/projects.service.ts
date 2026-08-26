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
import type { ProjectRow, MemberRole } from '@/types/database.types'

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

  async listMyProjects(): Promise<(ProjectRow & { governance_domains?: any })[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*, governance_domains(id, slug, label)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`[Projects] listMyProjects: ${error.message}`)
    return (data ?? []) as (ProjectRow & { governance_domains?: any })[]
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
    friccionesOportunidades?: string
  }): Promise<ProjectRow> {
    const { data, error } = await supabase.rpc('create_project', {
      p_name:       params.name,
      p_company_id: params.companyId ?? undefined,
      p_domain_id:  params.domainId ?? undefined,
      p_phase:      params.currentPhase ?? 'listen',
      p_objetivo_principal: params.objetivoPrincipal ?? undefined,
      p_restricciones: params.restricciones ?? undefined,
      p_horizonte_valor: params.horizonteValor ?? undefined,
      p_ecosistema_tecnologico: params.ecosistemaTecnologico ?? undefined,
      p_fricciones_oportunidades: params.friccionesOportunidades ?? undefined,
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
  async listProjectsByCompany(companyId: string): Promise<Pick<ProjectRow, 'id' | 'name'>[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name')
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
  async getProjectById(projectId: string): Promise<ProjectRow> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) throw new Error(`[Projects] getProjectById: ${error.message}`)
    return data as ProjectRow
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
  }): Promise<ProjectRow> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)('update_project', {
      p_project_id: projectId,
      p_name: params.name ?? undefined,
      p_objetivo_principal: params.objetivoPrincipal ?? undefined,
      p_restricciones: params.restricciones ?? undefined,
      p_horizonte_valor: params.horizonteValor ?? undefined,
      p_ecosistema_tecnologico: params.ecosistemaTecnologico ?? undefined,
      p_fricciones_oportunidades: params.friccionesOportunidades ?? undefined,
      p_areas_prioritarias: params.areasPrioritarias ?? undefined,
    })

    if (error) throw new Error(`[Projects] updateProject RPC error: ${error.message}`)
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
} = _service

// ── Alias de compatibilidad (deprecados) ────────────────────
/** @deprecated Usar listMyProjects */
export const listMyEngagements = listMyProjects
/** @deprecated Usar createProject */
export const createEngagement  = (p: { name: string; domainId?: string }) => createProject(p)
/** @deprecated Usar addProjectMember */
export const addMember         = addProjectMember
