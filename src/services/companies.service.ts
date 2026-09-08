// ============================================================
// Companies Service
//
// Sprint 8: nueva entidad empresa (multi-tenant).
// Sprint 9: sistema de 4 roles (superadmin/consultant/client_editor/client_viewer)
// Sprint 10: wrapped con makeAuditable — trazabilidad automática.
//
// Gestiona el CRUD de companies y la invitación de usuarios.
//
// Modelo:
//   Company → Projects (1:N)
//   Company → Users via profiles.company_id (1:N)
//
// Solo el platform_admin (role='superadmin') puede crear empresas
// e invitar usuarios. Los consultores Alpha se añaden a
// proyectos específicos via addProjectMember.
// ============================================================

import { supabase }                  from '@/lib/supabase'
import { getAuthHeader }             from '@/lib/getAuthHeader'
import { makeAuditable }             from '@/lib/audit'
import type { CompanyRow, UserRole } from '@/types/database.types'

// ── Implementaciones privadas ────────────────────────────────

const _impl = {

  // (Solo accesible para autenticados — RLS lo limita)
  async listCompanies(): Promise<CompanyRow[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw new Error(`[Companies] listCompanies: ${error.message}`)
    return data ?? []
  },

  async createCompany(params: {
    name: string
    slug?: string
  }): Promise<CompanyRow> {
    const slug = params.slug
      ?? params.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const { data, error } = await supabase
      .from('companies')
      .insert({ name: params.name, slug })
      .select()
      .single()

    if (error || !data) throw new Error(`[Companies] createCompany: ${error?.message}`)
    return data
  },

  // Llama a la Edge Function 'invite-user', que usa la Admin API
  // de Supabase con service role key para crear el usuario y
  // enviarle el email de invitación.
  // El trigger handle_new_user() aplica name, company_id y role al perfil.
  async inviteUserToCompany(params: {
    email:     string
    name:      string
    companyId: string
    role?:     UserRole
  }): Promise<void> {
    const headers = await getAuthHeader()
    if (!headers) throw new Error('[Companies] inviteUserToCompany: Sesión expirada — vuelve a iniciar sesión')

    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: {
        email:     params.email,
        name:      params.name,
        companyId: params.companyId,
        role:      params.role ?? 'client_viewer',
      },
      headers,
    })

    if (error) {
      throw new Error(`[Companies] inviteUserToCompany: ${error.message}`)
    }

    // La Edge Function devuelve { success: false, error: '...' } para errores de negocio
    if (data && !data.success) {
      throw new Error(data.error ?? 'Error al enviar la invitación')
    }
  },

  async listCompanyUsers(companyId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, created_at')
      .eq('company_id', companyId)
      .order('name', { ascending: true })

    if (error) throw new Error(`[Companies] listCompanyUsers: ${error.message}`)
    return data ?? []
  },

  async listAllUsers(): Promise<{
    id: string; email: string; name: string; role: UserRole; company_id: string | null; created_at: string
  }[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, company_id, created_at')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`[Companies] listAllUsers: ${error.message}`)
    return (data ?? []) as { id: string; email: string; name: string; role: UserRole; company_id: string | null; created_at: string }[]
  },

  // Llama a la Edge Function 'delete-user', que usa la Admin API
  // de Supabase con service role key para eliminar el usuario de Auth
  // (el perfil se borra en cascada por la FK profiles.id → auth.users.id).
  async deleteUser(userId: string): Promise<void> {
    const headers = await getAuthHeader()
    if (!headers) throw new Error('[Companies] deleteUser: Sesión expirada — vuelve a iniciar sesión')

    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
      headers,
    })

    if (error) {
      throw new Error(`[Companies] deleteUser: ${error.message}`)
    }

    if (data && !data.success) {
      throw new Error(data.error ?? 'Error al eliminar el usuario')
    }
  },

  // Usado por CompanyProfileView (ADR-011).
  async updateCompanySettings(
    companyId: string,
    params: { sector: string; company_size: string },
  ): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .update({ sector: params.sector, company_size: params.company_size })
      .eq('id', companyId)

    if (error) throw new Error(`[Companies] updateCompanySettings: ${error.message}`)
  },

  async listCompanyProjects(companyId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`[Companies] listCompanyProjects: ${error.message}`)
    return data ?? []
  },

  // Epic 3: obtener una empresa por ID (para detail view)
  async getCompanyById(companyId: string): Promise<CompanyRow> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single()

    if (error || !data) throw new Error(`[Companies] getCompanyById: ${error?.message}`)
    return data
  },

  // Epic 3: actualizar información de empresa (nombre, sector, tamaño, paquetes)
  async updateCompanyInfo(
    companyId: string,
    params: {
      name?: string
      sector?: string
      company_size?: string
      contracted_packages?: string[]
    },
  ): Promise<CompanyRow> {
    type UpdatePayload = {
      name?: string
      sector?: string
      company_size?: string
      contracted_packages?: string[]
    }

    const updates: UpdatePayload = {}
    if (params.name !== undefined) updates.name = params.name
    if (params.sector !== undefined) updates.sector = params.sector
    if (params.company_size !== undefined) updates.company_size = params.company_size
    if (params.contracted_packages !== undefined) {
      updates.contracted_packages = params.contracted_packages
    }

    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', companyId)
      .select()
      .single()

    if (error || !data) throw new Error(`[Companies] updateCompanyInfo: ${error?.message}`)
    return data
  },

  // Epic 3: alternar estado activo/inactivo de empresa
  async toggleCompanyActive(companyId: string, isActive: boolean): Promise<CompanyRow> {
    const { data, error } = await supabase
      .from('companies')
      .update({ is_active: isActive })
      .eq('id', companyId)
      .select()
      .single()

    if (error || !data) throw new Error(`[Companies] toggleCompanyActive: ${error?.message}`)
    return data
  },

  // Epic 3: obtener estadísticas de empresa (nº proyectos, usuarios)
  async getCompanyStats(companyId: string): Promise<{
    projectCount: number
    userCount: number
  }> {
    const [projectRes, userRes] = await Promise.all([
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active'),
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId),
    ])

    const projectCount = projectRes.count ?? 0
    const userCount = userRes.count ?? 0

    return { projectCount, userCount }
  },

  // Epic 3: eliminar empresa con validaciones
  // Bloquea si tiene proyectos o usuarios. Si está limpia, elimina en cascada.
  async deleteCompany(companyId: string): Promise<void> {
    // Verificar si tiene proyectos
    const { count: projectCount, error: projError } = await supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)

    if (projError) throw new Error(`[Companies] deleteCompany (check projects): ${projError.message}`)
    if ((projectCount ?? 0) > 0) {
      throw new Error(`No se puede eliminar: la empresa tiene ${projectCount} proyecto(s) activo(s)`)
    }

    // Verificar si tiene usuarios
    const { count: userCount, error: userError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)

    if (userError) throw new Error(`[Companies] deleteCompany (check users): ${userError.message}`)
    if ((userCount ?? 0) > 0) {
      throw new Error(`No se puede eliminar: la empresa tiene ${userCount} usuario(s) asignado(s)`)
    }

    // Si pasó las validaciones, eliminar
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId)

    if (deleteError) throw new Error(`[Companies] deleteCompany: ${deleteError.message}`)
  },

  // Epic 5: Funciones para gestión de usuarios en admin
  async listAllUsersWithStats(): Promise<any[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, is_active, company_id, created_at')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`[Companies] listAllUsersWithStats: ${error.message}`)
    return data ?? []
  },

  async getUserById(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) throw new Error(`[Companies] getUserById: ${error?.message}`)
    return data
  },

  async updateUserInfo(userId: string, params: { name?: string; role?: string }): Promise<any> {
    type UpdatePayload = { name?: string; role?: string }
    const updates: UpdatePayload = {}
    if (params.name !== undefined) updates.name = params.name
    if (params.role !== undefined) updates.role = params.role

    const { data, error } = await (supabase.from('profiles').update(updates as any))
      .eq('id', userId)
      .select()
      .single()

    if (error || !data) throw new Error(`[Companies] updateUserInfo: ${error?.message}`)
    return data
  },

  async toggleUserActive(userId: string, isActive: boolean): Promise<any> {
    const { data, error } = await (supabase.from('profiles').update({ is_active: isActive } as any))
      .eq('id', userId)
      .select()
      .single()

    if (error || !data) throw new Error(`[Companies] toggleUserActive: ${error?.message}`)
    return data
  },
}

// ── Punto de exportación auditado ────────────────────────────
// makeAuditable devuelve exactamente typeof _impl — autocompletado intacto.

const _service = makeAuditable(_impl, 'services.companies')

export const {
  listCompanies,
  createCompany,
  inviteUserToCompany,
  listCompanyUsers,
  listAllUsers,
  deleteUser,
  updateCompanySettings,
  listCompanyProjects,
  getCompanyById,
  updateCompanyInfo,
  toggleCompanyActive,
  getCompanyStats,
  deleteCompany,
  listAllUsersWithStats,
  getUserById,
  updateUserInfo,
  toggleUserActive,
} = _service
