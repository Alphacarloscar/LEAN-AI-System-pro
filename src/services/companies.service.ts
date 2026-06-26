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
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: {
        email:     params.email,
        name:      params.name,
        companyId: params.companyId,
        role:      params.role ?? 'client_viewer',
      },
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
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
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
} = _service
